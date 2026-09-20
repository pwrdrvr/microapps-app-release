import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const pnpmfile = require(join(repoRoot, '.pnpmfile.cjs'));
const { isGitSpec, isFirstParty, readPackage } = pnpmfile.__testing;

// Every shape pnpm resolves as a git fetch. Each was confirmed against pnpm
// 10.29.3 by installing it for real: `github:`, the bare `user/repo` form,
// `git+https://` and `git+ssh://` to GitHub all route through the
// `gitHostedTarball` fetcher, while a non-hosted remote routes through `git`.
const GIT_SPECS = [
  'github:jonschlinkert/time-require',
  'jonschlinkert/time-require',
  'jonschlinkert/time-require#v2.0.1',
  'git+https://github.com/jonschlinkert/time-require.git',
  'git+ssh://git@github.com/jonschlinkert/time-require.git',
  'git://github.com/jonschlinkert/time-require.git',
  'git@github.com:jonschlinkert/time-require.git',
  'gitlab:example/pkg',
  'bitbucket:example/pkg',
  'https://github.com/jonschlinkert/time-require',
  'git+file:///srv/git/pkg.git',
];

const REGISTRY_SPECS = [
  '4.9.5',
  '^2.2.1',
  '~1.0.0',
  '0.4.0-alpha.5',
  'workspace:*',
  'npm:other-package@1.0.0',
  'file:../local',
  'link:../local',
  '*',
  'latest',
];

const FIRST_PARTY_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

function workspacePackageNames() {
  const names = [JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).name];
  for (const entry of readdirSync(join(repoRoot, 'packages'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    // A directory without a package.json is not a workspace package. pnpm's own
    // `packages/*` glob skips those, so this must too — otherwise a stray build
    // or scratch directory fails the coverage test with an ENOENT rather than a
    // policy result.
    const manifest = join(repoRoot, 'packages', entry.name, 'package.json');
    if (!existsSync(manifest)) continue;
    names.push(JSON.parse(readFileSync(manifest, 'utf8')).name);
  }
  return names;
}

test('every git spec shape pnpm understands is recognised', () => {
  for (const spec of GIT_SPECS) {
    assert.equal(isGitSpec(spec), true, `expected ${spec} to be treated as a git spec`);
  }
});

test('ordinary registry and workspace specs are not mistaken for git specs', () => {
  for (const spec of REGISTRY_SPECS) {
    assert.equal(isGitSpec(spec), false, `expected ${spec} to be allowed`);
  }
});

test('git specs are blocked in every field pnpm will resolve, on any package', () => {
  for (const field of FIRST_PARTY_FIELDS) {
    for (const spec of GIT_SPECS) {
      assert.throws(
        () => readPackage({ name: 'some-transitive-package', [field]: { evil: spec } }),
        /Blocked git dependency/,
        `${field}: ${spec} should have been blocked`,
      );
    }
  }
});

test('git devDependencies are blocked in first-party packages', () => {
  for (const name of workspacePackageNames()) {
    for (const spec of GIT_SPECS) {
      assert.throws(
        () => readPackage({ name, devDependencies: { evil: spec } }),
        /Blocked git dependency/,
        `${name} devDependencies: ${spec} should have been blocked`,
      );
    }
  }
});

test('every workspace package is recognised as first party', () => {
  // Keeps .pnpmfile.cjs honest when a package is added under packages/. A new
  // workspace package that is not covered here would silently lose
  // devDependency protection, which is the half of the policy that matters most
  // on a developer machine and on the CI runner.
  for (const name of workspacePackageNames()) {
    assert.equal(isFirstParty({ name }), true, `${name} must be covered by .pnpmfile.cjs`);
  }
});

test('@pwrdrvr packages consumed from the registry are NOT treated as first party', () => {
  // The adaptation that PwrAgnt/PwrSnap/PwrGit did not need: their scopes
  // (@pwragent, @pwrsnap, @pwrgit) are exclusively their own, so they can use a
  // bare scope prefix. Here `@pwrdrvr` is shared with dependencies this repo
  // pulls from npm, and treating those as first party would scan their
  // devDependencies and reintroduce the transitive false positives.
  for (const name of ['@pwrdrvr/microapps-publish', '@pwrdrvr/microapps-datalib']) {
    assert.equal(isFirstParty({ name }), false, `${name} is a registry dependency, not ours`);
  }
});

test('transitive devDependencies with git specs are left alone', () => {
  // The real case in this repo's tree: time-require is a devDependency of
  // picomatch / micromatch / enquirer. pnpm never installs it — verified, it
  // does not appear in pnpm-lock.yaml — so blocking on it would fail the
  // install over another maintainer's tooling and remove no code from any
  // machine. Scanning all four fields on every manifest genuinely breaks
  // `pnpm install` here.
  const manifest = {
    name: 'picomatch',
    version: '2.3.1',
    devDependencies: { 'time-require': 'github:jonschlinkert/time-require' },
  };

  assert.doesNotThrow(() => readPackage(manifest));
  assert.equal(
    manifest.devDependencies['time-require'],
    'github:jonschlinkert/time-require',
    'the manifest should be returned untouched, not rewritten',
  );
});

test('git specs are blocked in pnpm.overrides and resolutions on first-party manifests', () => {
  // An override repoints a TRANSITIVE package, so it never appears in anyone's
  // dependencies block and is the quietest place to hide a git spec. The field
  // is live in this repo (class-transformer), not hypothetical.
  for (const spec of GIT_SPECS) {
    assert.throws(
      () => readPackage({ name: '@pwrdrvr/microapps-app-release-workspace', pnpm: { overrides: { lodash: spec } } }),
      /Blocked git dependency/,
      `pnpm.overrides: ${spec} should have been blocked`,
    );
    assert.throws(
      () => readPackage({ name: '@pwrdrvr/microapps-app-release-workspace', resolutions: { lodash: spec } }),
      /Blocked git dependency/,
      `resolutions: ${spec} should have been blocked`,
    );
  }
});

test('the override error names the field, not just "a git fetch"', () => {
  assert.throws(
    () => readPackage({ name: '@pwrdrvr/microapps-app-release-workspace', pnpm: { overrides: { lodash: 'github:a/b' } } }),
    /declared in @pwrdrvr\/microapps-app-release-workspace\.pnpm\.overrides/,
  );
});

test('legitimate override values still resolve', () => {
  // The forms actually in use: an exact version (this repo pins
  // class-transformer) and pnpm's `$name` reference to a declared dependency.
  assert.doesNotThrow(() =>
    readPackage({
      name: '@pwrdrvr/microapps-app-release-workspace',
      pnpm: { overrides: { 'class-transformer': '0.5.1', foo: '$foo', bar: '>=4.0.0', baz: 'npm:qux@1.0.0' } },
    }),
  );
});

test('a transitive package\'s own pnpm.overrides is ignored', () => {
  // pnpm only honours overrides from the workspace root, so scanning a
  // registry package's copy would be a false positive with nothing behind it.
  assert.doesNotThrow(() =>
    readPackage({ name: 'some-registry-package', pnpm: { overrides: { lodash: 'github:a/b' } } }),
  );
});

test('a package with no name is not first party', () => {
  assert.equal(isFirstParty({}), false);
  assert.equal(isFirstParty(undefined), false);
  assert.doesNotThrow(() => readPackage({ devDependencies: { evil: 'github:a/b' } }));
});

test('pnpm is handed both fetcher blocks, and each is a factory returning a thrower', async () => {
  const { fetchers } = pnpmfile.hooks;
  assert.deepEqual(Object.keys(fetchers).sort(), ['git', 'gitHostedTarball']);

  for (const [name, factory] of Object.entries(fetchers)) {
    // pnpm calls the entry once to build its registry, then calls the result.
    // A hook that threw from the factory would break every install.
    const fetcher = factory({ defaultFetchers: {} });
    assert.equal(typeof fetcher, 'function', `${name} must return a fetcher`);
    await assert.rejects(() => fetcher(), /Blocked pnpm git dependency fetch/);
  }
});

test('.npmrc neutralises any user-level global pnpmfile', () => {
  // Without this, pnpmfileChecksum in the lockfile covers a per-machine file
  // and `pnpm install --frozen-lockfile` fails with
  // ERR_PNPM_LOCKFILE_CONFIG_MISMATCH for whoever has one. Verified against
  // pnpm 10.29.3.
  const npmrc = readFileSync(join(repoRoot, '.npmrc'), 'utf8');
  assert.match(npmrc, /^\s*global-pnpmfile\s*=\s*$/m);
});

test('pnpm-workspace.yaml declares the cooldown and the build-script policy', () => {
  const workspace = readFileSync(join(repoRoot, 'pnpm-workspace.yaml'), 'utf8');

  assert.match(workspace, /^minimumReleaseAge:\s*10080\s*$/m);
  assert.match(workspace, /^minimumReleaseAgeExclude:/m);
  assert.match(workspace, /^onlyBuiltDependencies:\s*\[\]\s*$/m);
  assert.match(workspace, /^globalPnpmfile:\s*''\s*$/m);
  // The existing root-workspace smoke test also asserts this; repeated here so
  // the supply-chain settings cannot be added in a way that drops the glob.
  assert.match(workspace, /packages:\s*\n\s*-\s*"packages\/\*"/);
});
