import { test } from 'vitest';
import assert from 'node:assert/strict';

test('next config keeps the MicroApps base path and versioned asset prefix contract', async () => {
  const configModule = await import('../next.config.js');
  const config = configModule.default ?? configModule;

  assert.equal(config.basePath, '/release');
  assert.equal(config.assetPrefix, '/release/0.0.0');
  assert.equal(await config.generateBuildId(), '0.0.0');
});

test('next config keeps build-only files out of the standalone server trace', async () => {
  const { default: picomatch } = await import('next/dist/compiled/picomatch/index.js');
  const configModule = await import('../next.config.js');
  const config = configModule.default ?? configModule;
  const isExcluded = picomatch(config.outputFileTracingExcludes['*'], {
    contains: true,
    dot: true,
  });
  const nextDist = '../../node_modules/.pnpm/next@15/node_modules/next/dist';

  assert.ok(
    isExcluded(
      '../../node_modules/.pnpm/typescript@4.9.5/node_modules/typescript/lib/typescript.js',
    ),
  );
  assert.ok(isExcluded(`${nextDist}/compiled/babel/bundle.js`));
  assert.ok(isExcluded(`${nextDist}/server/dev/hot-reloader-webpack.js`));
  assert.ok(isExcluded(`${nextDist}/compiled/next-server/app-page-turbo.runtime.prod.js`));

  // Required at runtime by the production server; excluding these breaks startup or rendering.
  assert.ok(!isExcluded(`${nextDist}/server/dev/hot-reloader-types.js`));
  assert.ok(!isExcluded(`${nextDist}/compiled/babel/code-frame.js`));
  assert.ok(!isExcluded(`${nextDist}/compiled/@edge-runtime/cookies/index.js`));
  assert.ok(!isExcluded(`${nextDist}/compiled/next-server/app-page.runtime.prod.js`));
  assert.ok(
    !isExcluded('../../node_modules/react-dom/cjs/react-dom-server-legacy.browser.production.js'),
  );
});
