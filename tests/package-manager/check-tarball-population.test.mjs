import assert from 'node:assert/strict';
import test from 'node:test';

import {
  comparePopulations,
  isMetadataOnlyPath,
} from '../../scripts/package-manager/check-tarball-population.mjs';

// The construct files every published tarball carries, 0.6.0 included.
const constructFiles = [
  'API.md',
  'LICENSE',
  'README.md',
  'lib/index.d.ts',
  'lib/index.js',
  'package.json',
];

// 0.6.0 as published: the app payload is present, `.jsii` is not.
const published060 = [
  ...constructFiles,
  'lib/microapps-app-release/server/server.js',
  'lib/microapps-app-release/static_files/favicon.ico',
];

test('restoring .jsii against the 0.6.0 baseline is yellow, not red', () => {
  const result = comparePopulations({
    publishedFiles: published060,
    localFiles: ['.jsii', ...constructFiles],
  });

  assert.equal(result.status, 'yellow');
  assert.deepEqual(result.addedPaths, ['.jsii']);
  assert.deepEqual(result.removedPaths, []);
  assert.deepEqual(result.missingRequiredPaths, []);
  assert.equal(result.reason, 'Only metadata files changed: .jsii');
  assert.equal(result.skippedPayloadPaths, 2);
});

test('a tarball matching a baseline that already has .jsii is green', () => {
  const files = ['.jsii', ...constructFiles];
  const result = comparePopulations({ publishedFiles: files, localFiles: files });

  assert.equal(result.status, 'green');
});

test('dropping .jsii is red even though the diff alone would call it metadata', () => {
  const result = comparePopulations({
    publishedFiles: ['.jsii', ...constructFiles],
    localFiles: constructFiles,
  });

  assert.equal(result.status, 'red');
  assert.deepEqual(result.removedPaths, ['.jsii']);
  assert.deepEqual(result.missingRequiredPaths, ['.jsii']);
  assert.match(result.reason, /Required files missing from the new tarball: \.jsii/);
});

test('a tarball without .jsii is red even when it matches a baseline that also lacks it', () => {
  // The state every release from 0.3.0 to 0.6.0 was in: no drift, still broken.
  const result = comparePopulations({ publishedFiles: published060, localFiles: constructFiles });

  assert.equal(result.status, 'red');
  assert.deepEqual(result.addedPaths, []);
  assert.deepEqual(result.removedPaths, []);
  assert.deepEqual(result.missingRequiredPaths, ['.jsii']);
});

test('runtime drift alongside .jsii is still red', () => {
  const result = comparePopulations({
    publishedFiles: published060,
    localFiles: ['.jsii', ...constructFiles, 'lib/extra.js'],
  });

  assert.equal(result.status, 'red');
  assert.match(result.reason, /Runtime file population changed: \.jsii, lib\/extra\.js/);
});

test('symlinks stay red regardless of file population', () => {
  const files = ['.jsii', ...constructFiles];
  const result = comparePopulations({
    publishedFiles: files,
    localFiles: files,
    localSymlinkCount: 1,
  });

  assert.equal(result.status, 'red');
  assert.equal(result.reason, 'Tarball contains symlinks');
});

test('only the package-root assembly counts as metadata', () => {
  for (const filePath of ['.jsii', 'README.md', 'CHANGELOG.md', 'LICENSE', 'NOTICE']) {
    assert.equal(isMetadataOnlyPath(filePath), true, filePath);
  }

  for (const filePath of ['lib/.jsii', '.jsii.gz', 'x.jsii', 'API.md', 'lib/index.js']) {
    assert.equal(isMetadataOnlyPath(filePath), false, filePath);
  }
});
