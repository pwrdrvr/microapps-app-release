import { test } from 'vitest';
import assert from 'node:assert/strict';

test('next config keeps the MicroApps base path and versioned asset prefix contract', async () => {
  const configModule = await import('../next.config.js');
  const config = configModule.default ?? configModule;

  assert.equal(config.basePath, '/release');
  assert.equal(config.assetPrefix, '/release/0.0.0');
  assert.equal(await config.generateBuildId(), '0.0.0');
});
