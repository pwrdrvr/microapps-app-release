// Project-level pnpm install hooks. pnpm loads this file automatically every
// time it resolves dependencies (`pnpm install`, `pnpm add`, and the
// `pnpm install --frozen-lockfile` that `pwrdrvr/configure-nodejs` runs in CI).
//
// Ported from PwrAgnt/.pnpmfile.cjs (the same hook also lives in PwrSnap and
// PwrGit). See CONTRIBUTING.md for the repo-level description of the policy.
//
// ── Why this file exists ────────────────────────────────────────────────────
//
// Refuse to install dependencies specified via git URLs: `git+https://`,
// `git@`, `ssh://git@`, `github:` / `gitlab:` / `bitbucket:` shortcuts, the
// bare `user/repo` form, and GitHub/GitLab/Bitbucket HTTP URLs.
//
//   1. Supply-chain integrity. A registry spec resolves to a tarball with an
//      integrity hash the lockfile pins; a git spec resolves to whatever the
//      remote serves for a ref, with no registry-side integrity check. Fetching
//      one runs the package's lifecycle scripts (`prepare`, `prepack`,
//      `install`, `postinstall`) against arbitrary code from an arbitrary
//      remote — on a contributor's laptop and on the GitHub Actions runner,
//      which is the threat this repo cares about.
//
//   2. Reproducibility. Tags can be force-pushed and commits can be deleted, so
//      a git spec can resolve differently over time. A tarball with an
//      integrity hash either matches or it doesn't.
//
// The repo has no git dependencies today. This hook locks that in: a careless
// or malicious PR that adds one fails `pnpm install` loudly, before anything is
// fetched and before any lifecycle script runs.
//
// The companion `.npmrc` sets `global-pnpmfile=` so a contributor's personal
// `~/.pnpm/global_pnpmfile.cjs` does not also apply here. That keeps the
// lockfile's `pnpmfileChecksum` portable — every machine that runs pnpm in this
// repo hashes exactly this file and nothing else, so `--frozen-lockfile`
// behaves identically for everyone. It also makes the hook tamper-evident:
// because the checksum is recorded in `pnpm-lock.yaml`, this file cannot be
// weakened or deleted without a visible lockfile diff.

'use strict';

// Fields scanned on EVERY package, first-party and transitive alike. These are
// the fields whose specs pnpm will actually try to resolve no matter who
// declared them.
const DEPENDENCY_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

// `devDependencies` is scanned only for first-party packages — see
// `isFirstParty` below for why, and `tests/supply-chain/` for the test that
// keeps this list in sync with `pnpm-workspace.yaml`.
const FIRST_PARTY_PACKAGE_NAMES = new Set([
  '@pwrdrvr/microapps-app-release-workspace',
  '@pwrdrvr/microapps-app-release',
  '@pwrdrvr/microapps-app-release-cdk',
  '@pwrdrvr/microapps-app-release-cdk-stack',
]);

// Safety net for workspace packages added later. Deliberately NOT `@pwrdrvr/`:
// unlike PwrAgnt's `@pwragent/` or PwrSnap's `@pwrsnap/`, the `@pwrdrvr` scope
// here is shared with registry dependencies this repo consumes
// (`@pwrdrvr/microapps-publish`, `@pwrdrvr/microapps-datalib`). Treating those
// as first party would scan their `devDependencies` and reintroduce exactly the
// false-positive class this split exists to avoid.
const FIRST_PARTY_PACKAGE_PREFIX = '@pwrdrvr/microapps-app-release';

// The spec shapes pnpm itself treats as a git fetch. The final alternation is
// the bare `user/repo#ref` GitHub shortcut, which pnpm resolves the same way as
// `github:user/repo`.
//
// That last branch is spelled `[^/@\s:]+` rather than PwrAgnt/PwrSnap/PwrGit's
// `[^/@\s]+`. Excluding `:` is a fix, not a style change: without it, any
// protocol spec whose path has exactly one segment is read as a `user/repo`
// shortcut and blocked. `file:../local` parses as `file:..` + `/` + `local` and
// throws, as do `link:../local` and `workspace:../pkg`. Nothing here uses those
// today — the test suite is what caught it — but the same three lines are in
// all three sibling repos and will misfire there the day someone adds one.
const GIT_SPEC_PATTERN =
  /^(?:git(?:\+|:)|git@|ssh:\/\/git@|github:|gitlab:|bitbucket:|https?:\/\/(?:www\.)?(?:github|gitlab|bitbucket)\.com\/|[^/@\s:]+\/[^/\s]+(?:#.*)?$)/;

function isGitSpec(spec) {
  return typeof spec === 'string' && GIT_SPEC_PATTERN.test(spec);
}

// Keyed on the package NAME rather than on the shape of the manifest: pnpm
// hands `readPackage` the same object for our own packages and for anything it
// pulled from the registry, and a name check is the one signal that cannot be
// spoofed by an upstream manifest that happens to look like a workspace root.
function isFirstParty(pkg) {
  if (!pkg || typeof pkg.name !== 'string') return false;
  if (FIRST_PARTY_PACKAGE_NAMES.has(pkg.name)) return true;
  return pkg.name.startsWith(FIRST_PARTY_PACKAGE_PREFIX);
}

function scanField(pkg, field) {
  const dependencies = pkg[field];
  if (!dependencies) return;
  for (const [name, spec] of Object.entries(dependencies)) {
    if (!isGitSpec(spec)) continue;
    throw new Error(
      `[microapps-app-release pnpmfile] Blocked git dependency ${name}@${spec} ` +
        `(declared in ${pkg.name ?? '<unknown>'}.${field}). Git specs bypass ` +
        `registry tarball integrity checks and run arbitrary lifecycle scripts ` +
        `against arbitrary remotes. Publish a registry tarball or vendor the source.`,
    );
  }
}

function readPackage(pkg) {
  for (const field of DEPENDENCY_FIELDS) {
    scanField(pkg, field);
  }

  // Scanning `devDependencies` on transitive packages breaks real dependency
  // trees, because pnpm calls `readPackage` for every manifest it resolves but
  // never installs a transitive package's devDependencies. This repo hits it
  // through `time-require@github:jonschlinkert/time-require`, a devDependency
  // of picomatch / micromatch / enquirer that never reaches `pnpm-lock.yaml`.
  // Upstream has several more of these (`protobufjs -> jaguarjs-jsdoc`,
  // `yauzl -> buffer-crc32 -> tap -> eslint-plugin-node-core`, axe-core's test
  // fixtures), so blocking on them would fail installs over other maintainers'
  // tooling choices without removing any code from this machine.
  //
  // First-party devDependencies are a different matter: they DO install, on
  // contributor machines and on the CI runner, they run lifecycle scripts, and
  // they are importable at build and test time. A git devDep in one of our own
  // package.json files is as dangerous as a git runtime dep — arguably worse,
  // because it runs where the credentials are. So we scan those.
  if (isFirstParty(pkg)) {
    scanField(pkg, 'devDependencies');
  }

  return pkg;
}

// Belt and suspenders. If a git spec somehow reaches resolution without passing
// through `readPackage` above, the fetcher that would download it refuses to
// run.
//
// pnpm's `hooks.fetchers` entries are FACTORY functions: pnpm calls each one
// with `({ defaultFetchers })` while building its fetcher registry, and the
// factory's RETURN VALUE is the fetcher invoked later. Hence the extra closure —
// throwing from the factory itself would fail every install, git spec or not.
function blockGitFetcher(/* { defaultFetchers } */) {
  return async () => {
    throw new Error(
      '[microapps-app-release pnpmfile] Blocked pnpm git dependency fetch. See .pnpmfile.cjs.',
    );
  };
}

module.exports = {
  hooks: {
    readPackage,
    fetchers: {
      // Both entries are required, and the split is not the one the names
      // suggest. Measured on pnpm 10.29.3 by making each fetcher throw a
      // distinguishable error:
      //
      //   github:user/repo                        -> gitHostedTarball
      //   user/repo                               -> gitHostedTarball
      //   git+https://github.com/user/repo.git    -> gitHostedTarball
      //   git+ssh://git@github.com/user/repo.git  -> gitHostedTarball
      //   git+file:///srv/repo.git (non-hosted)   -> git
      //
      // So `gitHostedTarball` covers EVERY GitHub spec shape, including the
      // ones that look like plain git URLs: pnpm downloads a codeload tarball
      // of the resolved commit rather than cloning. `git` only fires for
      // remotes pnpm has no host shortcut for — self-hosted GitLab, Gitea,
      // `git+file://`, and so on. Blocking `git` alone, as PwrSnap did before
      // commit 8e8de2ff, is dead code against anything hosted on GitHub.
      git: blockGitFetcher,
      gitHostedTarball: blockGitFetcher,
    },
  },
};

// Exported for tests only. pnpm reads `hooks` and ignores everything else.
module.exports.__testing = {
  isGitSpec,
  isFirstParty,
  readPackage,
  FIRST_PARTY_PACKAGE_NAMES,
  FIRST_PARTY_PACKAGE_PREFIX,
};
