import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

/**
 * The `packages:` globs declared in pnpm-workspace.yaml, `!` exclusions last.
 *
 * Read from the file rather than hardcoded, because this test's whole job is to
 * notice drift — and a helper that always looks in `packages/` would go quietly
 * blind the day the workspace gains an `apps/*` or a nested glob, which is
 * exactly when the coverage it provides matters most. Hand-parsed for the same
 * reason the other scripts here are: no YAML library is a root dependency.
 */
function workspaceGlobs(yaml = readFileSync(join(repoRoot, 'pnpm-workspace.yaml'), 'utf8')) {
  const globs = [];
  let inPackages = false;

  for (const raw of yaml.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (!inPackages) continue;

    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item) {
      const value = item[1].replace(/\s+#.*$/, '').trim().replace(/^['"]|['"]$/g, '');
      if (value !== '') globs.push(value);
      continue;
    }
    // A blank line or comment may sit inside the list; anything else ends it.
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    break;
  }

  return globs;
}

/** Directories matching one glob, relative to `root`. */
function expandGlob(glob, root = repoRoot) {
  // Only the shapes pnpm workspaces actually use: a literal path, `dir/*`, and
  // `dir/**`. Anything else should fail loudly rather than silently match
  // nothing, which would look like "all packages are covered".
  const recursive = glob.endsWith('/**');
  const immediate = glob.endsWith('/*');
  if (!recursive && !immediate) return existsSync(join(root, glob)) ? [glob] : [];

  const base = glob.slice(0, recursive ? -3 : -2);
  if (/[*?[\]]/.test(base)) {
    throw new Error(`workspace glob ${glob} has a wildcard this test cannot expand`);
  }

  const found = [];
  const walk = (dir) => {
    if (!existsSync(join(root, dir))) return;
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'node_modules') continue;
      const child = `${dir}/${entry.name}`;
      found.push(child);
      if (recursive) walk(child);
    }
  };
  walk(base);
  return found;
}

function workspacePackageNames(root = repoRoot, globs = workspaceGlobs()) {
  const names = [JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name];
  const excluded = [];
  const included = [];

  for (const glob of globs) {
    // `!` marks a directory pnpm removes from the workspace again. Handled
    // rather than rejected, because dropping the branch would be worse than it
    // looks: `expandGlob('!foo')` has no wildcard, `existsSync` on a literal
    // `!foo` is false, and the entry would be SILENTLY discarded instead of
    // throwing — quietly widening the set of packages we claim to have checked.
    if (glob.startsWith('!')) excluded.push(...expandGlob(glob.slice(1), root));
    else included.push(...expandGlob(glob, root));
  }

  for (const dir of included) {
    if (excluded.includes(dir)) continue;
    // A directory without a package.json is not a workspace package. pnpm's own
    // globs skip those, so this must too — otherwise a stray build or scratch
    // directory fails the coverage test with an ENOENT rather than a policy
    // result.
    const manifest = join(root, dir, 'package.json');
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

test('the glob parser reads quotes, comments and exclusions out of the block', () => {
  const globs = workspaceGlobs(
    [
      'packages:',
      '  # our code',
      "  - 'apps/*'",
      '  - "packages/*"   # quoted',
      '  - packages/messaging/**',
      '',
      '  - "!packages/legacy"',
      'minimumReleaseAge: 10080',
      '  - ignored/*',
    ].join('\n'),
  );

  assert.deepEqual(globs, ['apps/*', 'packages/*', 'packages/messaging/**', '!packages/legacy']);
});

test('a flow-style packages list yields no globs, which the non-empty assertion catches', () => {
  // Deliberately unsupported rather than half-parsed. It reads as zero globs,
  // and zero globs must never be mistaken for "nothing to check, all covered" —
  // that is what the length assertion in the next test is for.
  assert.deepEqual(workspaceGlobs('packages: ["packages/*"]\n'), []);
});

test('expansion handles nesting and exclusions, and skips node_modules', () => {
  const root = mkdtempSync(join(tmpdir(), 'ws-'));
  const pkg = (dir, name) => {
    mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(join(root, dir, 'package.json'), JSON.stringify({ name, version: '0.0.0' }));
  };

  pkg('.', 'root-pkg');
  pkg('packages/a', '@x/a');
  pkg('packages/b', '@x/b');
  pkg('packages/legacy', '@x/legacy');
  pkg('nested/one/deep', '@x/deep');
  // INSIDE a recursively-walked path, not at the root — a root-level
  // node_modules is never reached by these globs, so putting it there would
  // make the assertion below pass whether or not the skip exists.
  pkg('nested/one/node_modules/evil', 'evil');
  // An intermediate directory with no manifest — pnpm skips it, so must we.
  mkdirSync(join(root, 'nested/empty'), { recursive: true });

  const names = workspacePackageNames(root, ['packages/*', 'nested/**', '!packages/legacy']);

  assert.deepEqual(names.sort(), ['@x/a', '@x/b', '@x/deep', 'root-pkg'].sort());
  assert.ok(!names.includes('@x/legacy'), 'the ! exclusion must remove it');
  assert.ok(!names.includes('evil'), 'node_modules must never be walked');

  rmSync(root, { recursive: true, force: true });
});

test('a glob shape the expander cannot evaluate throws instead of matching nothing', () => {
  // Silently returning [] would read as "this glob covers no packages", which
  // is indistinguishable from full coverage. Fail loudly and be taught.
  assert.throws(() => expandGlob('packages/*/src/*'), /cannot expand/);
});

test('the coverage enumeration follows pnpm-workspace.yaml, not a hardcoded dir', () => {
  // Without this, the test below silently narrows to whatever directory was
  // hardcoded the day it was written. The globs are the contract; a workspace
  // that grows an `apps/*` must not quietly drop out of first-party coverage.
  const globs = workspaceGlobs();
  assert.ok(globs.length > 0, 'pnpm-workspace.yaml must declare packages: globs');
  assert.deepEqual(globs, ['packages/*'], 'globs changed — confirm every one is still enumerated');

  // Every glob resolves to at least one real manifest, so a typo cannot read as
  // "nothing to check, all covered".
  const names = workspacePackageNames();
  assert.equal(names.length, 4, `expected root + 3 packages, got ${names.join(', ')}`);
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
