import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  auditDependencyMaturity,
  findExclusion,
  matcherCovers,
  parseExclusions,
  parseLockedPackages,
  parseMaturityPolicy,
} from './check-dependency-maturity.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const WINDOW_MINUTES = 10_080;
const NOW = Date.parse('2026-09-20T12:00:00.000Z');
const DAY = 86_400_000;

function isoDaysAgo(days) {
  return new Date(NOW - days * DAY).toISOString();
}

function audit({ packages, published = {}, exclusions = [] }) {
  const { matchers, unsupported } = parseExclusions(exclusions);
  assert.deepEqual(unsupported, []);
  return auditDependencyMaturity({
    packages,
    publishedAt: new Map(Object.entries(published)),
    matchers,
    minimumReleaseAgeMinutes: WINDOW_MINUTES,
    now: NOW,
  });
}

test('parseMaturityPolicy reads the cooldown and its list past interleaved comments', () => {
  const policy = parseMaturityPolicy(
    [
      'packages:',
      '  - "packages/*"',
      '',
      '# Supply-chain cooldown.',
      'minimumReleaseAge: 10080',
      '',
      'minimumReleaseAgeExclude:',
      '  # reviewed, taken early on purpose',
      '  - "@pwrdrvr/microapps-publish"',
      "  - 'zod@4.5.1'",
      '',
      'onlyBuiltDependencies: []',
    ].join('\n'),
  );

  assert.equal(policy.minimumReleaseAgeMinutes, 10_080);
  assert.deepEqual(policy.exclusions, ['@pwrdrvr/microapps-publish', 'zod@4.5.1']);
});

test('parseMaturityPolicy handles the inline empty list this repo ships', () => {
  const policy = parseMaturityPolicy(
    ['minimumReleaseAge: 10080', 'minimumReleaseAgeExclude: []', 'onlyBuiltDependencies: []'].join(
      '\n',
    ),
  );

  assert.equal(policy.minimumReleaseAgeMinutes, 10_080);
  assert.deepEqual(policy.exclusions, []);
});

test('parseMaturityPolicy reports an absent cooldown even when exclusions are listed', () => {
  const policy = parseMaturityPolicy(
    ['minimumReleaseAgeExclude:', '  - "zod@4.5.1"'].join('\n'),
  );

  assert.equal(policy.minimumReleaseAgeMinutes, undefined);
  assert.deepEqual(policy.exclusions, ['zod@4.5.1']);
});

test('parseLockedPackages reads `packages:` only, skipping non-registry resolutions', () => {
  const packages = parseLockedPackages(
    [
      "lockfileVersion: '9.0'",
      '',
      'packages:',
      '',
      '  typescript@4.9.5:',
      '    resolution: {integrity: sha512-x}',
      "  '@pwrdrvr/microapps-datalib@0.4.0-alpha.5':",
      '    resolution: {integrity: sha512-y}',
      '  local@file:../local:',
      '    resolution: {directory: ../local, type: directory}',
      '',
      'snapshots:',
      '',
      '  typescript@4.9.5: {}',
    ].join('\n'),
  );

  assert.deepEqual(packages, [
    { name: 'typescript', version: '4.9.5' },
    { name: '@pwrdrvr/microapps-datalib', version: '0.4.0-alpha.5' },
  ]);
});

test('parseExclusions rejects semver ranges rather than guessing at their span', () => {
  const { matchers, unsupported } = parseExclusions(['pkg', '@scope/*', 'pkg@1.2.3', 'pkg@^1.2.3']);

  assert.deepEqual(unsupported, ['pkg@^1.2.3']);
  assert.deepEqual(
    matchers.map(({ name, versions }) => ({ name, versions })),
    [
      { name: 'pkg', versions: undefined },
      { name: '@scope/*', versions: undefined },
      { name: 'pkg', versions: ['1.2.3'] },
    ],
  );
});

test('matcherCovers honours bare names, scope wildcards and exact versions', () => {
  const { matchers } = parseExclusions(['pkg', '@scope/*', 'other@1.0.0 || 1.0.1']);
  const [bare, wildcard, exact] = matchers;

  assert.equal(matcherCovers(bare, 'pkg', '9.9.9'), true);
  assert.equal(matcherCovers(bare, 'pkg-other', '9.9.9'), false);
  assert.equal(matcherCovers(wildcard, '@scope/anything', '1.0.0'), true);
  assert.equal(matcherCovers(wildcard, '@other/thing', '1.0.0'), false);
  assert.equal(matcherCovers(exact, 'other', '1.0.1'), true);
  assert.equal(matcherCovers(exact, 'other', '1.0.2'), false);
  assert.equal(findExclusion('pkg', '1.0.0', matchers)?.entry, 'pkg');
  assert.equal(findExclusion('nothing', '1.0.0', matchers), undefined);
});

test('a release younger than the window is reported as immature', () => {
  const result = audit({
    packages: [{ name: 'fresh', version: '1.0.0' }],
    published: { 'fresh@1.0.0': isoDaysAgo(2) },
  });

  assert.equal(result.immature.length, 1);
  assert.equal(result.immature[0].name, 'fresh');
  assert.equal(result.immature[0].maturesAt, Date.parse(isoDaysAgo(2)) + WINDOW_MINUTES * 60_000);
});

test('a release older than the window passes', () => {
  const result = audit({
    packages: [{ name: 'old', version: '1.0.0' }],
    published: { 'old@1.0.0': isoDaysAgo(30) },
  });

  assert.deepEqual(result.immature, []);
  assert.deepEqual(result.unverifiable, []);
});

test('an exclusion lets a young release through and is counted', () => {
  const result = audit({
    packages: [{ name: 'fresh', version: '1.0.0' }],
    published: { 'fresh@1.0.0': isoDaysAgo(1) },
    exclusions: ['fresh@1.0.0'],
  });

  assert.deepEqual(result.immature, []);
  assert.equal(result.excludedCount, 1);
});

test('a missing publish time is fatal unless the release is excluded', () => {
  assert.deepEqual(audit({ packages: [{ name: 'ghost', version: '1.0.0' }] }).unverifiable, [
    'ghost@1.0.0',
  ]);
  assert.deepEqual(
    audit({ packages: [{ name: 'ghost', version: '1.0.0' }], exclusions: ['ghost@1.0.0'] })
      .unverifiable,
    [],
  );
});

test('a pinned exclusion that has matured is reported as prunable, not fatal', () => {
  const result = audit({
    packages: [{ name: 'settled', version: '1.0.0' }],
    published: { 'settled@1.0.0': isoDaysAgo(60) },
    exclusions: ['settled@1.0.0'],
  });

  assert.deepEqual(result.immature, []);
  assert.equal(result.stale.length, 1);
  assert.match(result.stale[0].reason, /matured past the window/);
});

test('an exclusion nothing resolves any more is reported as prunable', () => {
  const result = audit({
    packages: [{ name: 'kept', version: '2.0.0' }],
    published: { 'kept@2.0.0': isoDaysAgo(60) },
    exclusions: ['gone@1.0.0'],
  });

  assert.deepEqual(result.stale, [
    { entry: 'gone@1.0.0', reason: 'nothing in the lockfile resolves it' },
  ]);
});

test('bare names and scope wildcards are standing policy, never reported as stale', () => {
  const result = audit({
    packages: [{ name: 'anything', version: '1.0.0' }],
    published: { 'anything@1.0.0': isoDaysAgo(60) },
    exclusions: ['unused-name', '@unused/*'],
  });

  assert.deepEqual(result.stale, []);
});

test("this repo's committed policy declares a cooldown and parses its lockfile", () => {
  const policy = parseMaturityPolicy(readFileSync(join(repoRoot, 'pnpm-workspace.yaml'), 'utf8'));
  assert.equal(
    policy.minimumReleaseAgeMinutes,
    10_080,
    'pnpm-workspace.yaml must declare the seven-day cooldown',
  );

  const { unsupported } = parseExclusions(policy.exclusions);
  assert.deepEqual(unsupported, [], 'exclusions must pin exact versions, not ranges');

  const packages = parseLockedPackages(readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8'));
  assert.ok(packages.length > 100, `expected the lockfile to pin many packages, got ${packages.length}`);
});
