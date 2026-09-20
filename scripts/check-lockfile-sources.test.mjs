import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  findGitResolutions,
  findGitSpecifiers,
  neutralisesGlobalPnpmfile,
  pnpmfileChecksum,
  readLockfileChecksum,
} from './check-lockfile-sources.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Captured from a real `pnpm install --lockfile-only` on pnpm 10.29.3, for
// `"time-require": "github:jonschlinkert/time-require"`. The resolution host is
// `codeload.github.com`, NOT `github.com` — a lockfile audit that matches
// `tarball: https://github` misses every GitHub git dependency pnpm 10 writes.
const GITHUB_SHORTCUT_LOCKFILE = `lockfileVersion: '9.0'

importers:

  .:
    dependencies:
      time-require:
        specifier: github:jonschlinkert/time-require
        version: https://codeload.github.com/jonschlinkert/time-require/tar.gz/c255aec6f801612f5c132a5cb9ca87f327af2584

packages:

  time-require@https://codeload.github.com/jonschlinkert/time-require/tar.gz/c255aec6f801612f5c132a5cb9ca87f327af2584:
    resolution: {tarball: https://codeload.github.com/jonschlinkert/time-require/tar.gz/c255aec6f801612f5c132a5cb9ca87f327af2584}
    version: 2.0.1
`;

// Same install, spelled `git+https://github.com/...`. pnpm records an identical
// resolution: the two spec shapes differ only in the `specifier:` line.
const GIT_URL_LOCKFILE = GITHUB_SHORTCUT_LOCKFILE.replace(
  'specifier: github:jonschlinkert/time-require',
  'specifier: git+https://github.com/jonschlinkert/time-require.git',
);

// The `type: git` shape pnpm writes for a remote it has no host shortcut for.
const NON_HOSTED_GIT_LOCKFILE = `lockfileVersion: '9.0'

importers:

  .:
    dependencies:
      local-pkg:
        specifier: git+ssh://git@git.internal.example.com/team/pkg.git
        version: git+ssh://git@git.internal.example.com/team/pkg.git#abc123

packages:

  local-pkg@git+ssh://git@git.internal.example.com/team/pkg.git#abc123:
    resolution: {type: git, repo: ssh://git@git.internal.example.com/team/pkg.git, commit: abc123}
    version: 1.0.0
`;

const CLEAN_LOCKFILE = `lockfileVersion: '9.0'

pnpmfileChecksum: sha256-AAAA

importers:

  .:
    devDependencies:
      typescript:
        specifier: 4.9.5
        version: 4.9.5

packages:

  typescript@4.9.5:
    resolution: {integrity: sha512-deadbeef}
    engines: {node: '>=4.2.0'}
`;

test('a github: shortcut dependency is caught by both detectors', () => {
  const resolutions = findGitResolutions(GITHUB_SHORTCUT_LOCKFILE);
  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].label, 'git-host tarball resolution');

  const specifiers = findGitSpecifiers(GITHUB_SHORTCUT_LOCKFILE);
  assert.deepEqual(
    specifiers.map(({ importer, name, specifier }) => ({ importer, name, specifier })),
    [{ importer: '.', name: 'time-require', specifier: 'github:jonschlinkert/time-require' }],
  );
});

test('a git+https:// dependency is caught by both detectors', () => {
  assert.equal(findGitResolutions(GIT_URL_LOCKFILE).length, 1);
  assert.deepEqual(
    findGitSpecifiers(GIT_URL_LOCKFILE).map(({ specifier }) => specifier),
    ['git+https://github.com/jonschlinkert/time-require.git'],
  );
});

test('the codeload host is matched — a `tarball: https://github` pattern would not be', () => {
  // Regression guard for the audit this repo nearly shipped. Asserting the
  // miss explicitly, so nobody "simplifies" the host pattern back into it.
  const naive = /resolution:\s*\{\s*tarball:\s*https?:\/\/(?:github|gitlab|bitbucket)\b/;
  const resolutionLine = GITHUB_SHORTCUT_LOCKFILE.split('\n').find((line) =>
    line.includes('resolution:'),
  );

  assert.equal(naive.test(resolutionLine), false, 'fixture should defeat the naive pattern');
  assert.equal(findGitResolutions(GITHUB_SHORTCUT_LOCKFILE).length, 1, 'ours must still catch it');
});

test('a non-hosted git remote is caught via `type: git` and `repo:`', () => {
  const resolutions = findGitResolutions(NON_HOSTED_GIT_LOCKFILE);
  assert.equal(resolutions.length, 1);
  assert.equal(resolutions[0].label, 'git resolution');
  assert.equal(findGitSpecifiers(NON_HOSTED_GIT_LOCKFILE).length, 1);
});

test('a registry-only lockfile is clean', () => {
  assert.deepEqual(findGitResolutions(CLEAN_LOCKFILE), []);
  assert.deepEqual(findGitSpecifiers(CLEAN_LOCKFILE), []);
  assert.equal(readLockfileChecksum(CLEAN_LOCKFILE), 'sha256-AAAA');
});

test('`version: 4.9.5` style lines are not mistaken for resolutions', () => {
  // `version:` appears next to every resolution; only `resolution:` and `repo:`
  // lines may produce findings.
  assert.deepEqual(findGitResolutions('packages:\n  a@1.0.0:\n    version: 1.0.0\n'), []);
});

test('pnpmfileChecksum is sha256-<base64>, the format pnpm writes', () => {
  // Verified against a lockfile pnpm 10.29.3 generated for this repo.
  assert.equal(pnpmfileChecksum(''), 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=');
  assert.match(pnpmfileChecksum('module.exports = {}'), /^sha256-[A-Za-z0-9+/]+=*$/);
});

test('neutralisesGlobalPnpmfile accepts only an empty assignment', () => {
  assert.equal(neutralisesGlobalPnpmfile('ignore-scripts=false\nglobal-pnpmfile=\n'), true);
  assert.equal(neutralisesGlobalPnpmfile('global-pnpmfile = \n'), true);
  assert.equal(neutralisesGlobalPnpmfile('global-pnpmfile=~/.pnpm/global_pnpmfile.cjs\n'), false);
  assert.equal(neutralisesGlobalPnpmfile('ignore-scripts=false\n'), false);
});

test("this repo's own committed files satisfy every check", () => {
  const lockfile = readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8');
  const pnpmfile = readFileSync(join(repoRoot, '.pnpmfile.cjs'));
  const npmrc = readFileSync(join(repoRoot, '.npmrc'), 'utf8');

  assert.deepEqual(findGitResolutions(lockfile), []);
  assert.deepEqual(findGitSpecifiers(lockfile), []);
  assert.equal(neutralisesGlobalPnpmfile(npmrc), true);
  assert.equal(
    readLockfileChecksum(lockfile),
    pnpmfileChecksum(pnpmfile),
    'pnpm-lock.yaml must pin the committed .pnpmfile.cjs — run `pnpm install --lockfile-only`',
  );
});
