import assert from 'node:assert/strict';
import test from 'node:test';

import { planApiCompat } from '../../scripts/package-manager/check-api-compat.mjs';

test('skips when there is no published baseline', () => {
  const plan = planApiCompat({
    publishedVersion: null,
    publishedTarballPath: null,
    publishedFiles: [],
  });

  assert.equal(plan.run, false);
  assert.match(plan.reason, /No published baseline/);
});

test('skips when the published tarball has no .jsii, as 0.3.0 through 0.6.0 do', () => {
  const plan = planApiCompat({
    publishedVersion: '0.6.0',
    publishedTarballPath: '/tmp/pwrdrvr-microapps-app-release-cdk-0.6.0.tgz',
    publishedFiles: ['API.md', 'README.md', 'lib/index.js', 'lib/index.d.ts', 'package.json'],
  });

  assert.equal(plan.run, false);
  assert.match(plan.reason, /Published 0\.6\.0 has no \.jsii assembly/);
});

test('only a package-root .jsii counts as a baseline assembly', () => {
  const plan = planApiCompat({
    publishedVersion: '0.6.0',
    publishedTarballPath: '/tmp/pwrdrvr-microapps-app-release-cdk-0.6.0.tgz',
    publishedFiles: ['lib/.jsii', 'package.json'],
  });

  assert.equal(plan.run, false);
});

test('runs once the published tarball carries .jsii', () => {
  const plan = planApiCompat({
    publishedVersion: '0.7.0',
    publishedTarballPath: '/tmp/pwrdrvr-microapps-app-release-cdk-0.7.0.tgz',
    publishedFiles: ['.jsii', 'API.md', 'lib/index.js', 'package.json'],
  });

  assert.equal(plan.run, true);
  assert.match(plan.reason, /Comparing against published 0\.7\.0/);
});
