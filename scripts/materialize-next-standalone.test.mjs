import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { materializeNextStandalone } from './materialize-next-standalone.mjs';

test('materializeNextStandalone expands pnpm virtual-store packages for Lambda packaging', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'materialize-next-standalone-'));

  try {
    const standaloneDir = path.join(tempRoot, 'packages', 'app', '.next', 'standalone');
    const standaloneNodeModulesDir = path.join(standaloneDir, 'node_modules');
    const appNodeModulesDir = path.join(tempRoot, 'packages', 'app', 'node_modules');
    const nextVirtualNodeModulesDir = path.join(
      appNodeModulesDir,
      '.pnpm',
      'next@1.0.0',
      'node_modules',
    );
    const reactVirtualNodeModulesDir = path.join(
      appNodeModulesDir,
      '.pnpm',
      'react@1.0.0',
      'node_modules',
    );

    fs.mkdirSync(path.join(standaloneDir, '.next'), { recursive: true });
    fs.mkdirSync(standaloneNodeModulesDir, { recursive: true });
    fs.mkdirSync(path.join(nextVirtualNodeModulesDir, 'next', 'dist', 'shared', 'lib'), {
      recursive: true,
    });
    fs.mkdirSync(path.join(nextVirtualNodeModulesDir, '@swc', 'helpers', 'lib'), {
      recursive: true,
    });
    fs.mkdirSync(path.join(reactVirtualNodeModulesDir, 'react'), { recursive: true });
    fs.mkdirSync(appNodeModulesDir, { recursive: true });

    fs.writeFileSync(path.join(standaloneDir, 'server.js'), 'console.log("server");\n');
    fs.writeFileSync(path.join(standaloneDir, '.next', 'BUILD_ID'), '0.0.0-pr.test\n');
    fs.writeFileSync(
      path.join(nextVirtualNodeModulesDir, 'next', 'dist', 'shared', 'lib', 'utils.js'),
      'module.exports = require("@swc/helpers/lib/_async_to_generator.js");\n',
    );
    fs.writeFileSync(
      path.join(nextVirtualNodeModulesDir, '@swc', 'helpers', 'lib', '_async_to_generator.js'),
      'module.exports = function _async_to_generator() {};\n',
    );
    fs.writeFileSync(path.join(reactVirtualNodeModulesDir, 'react', 'index.js'), 'module.exports = {};\n');

    fs.symlinkSync(
      '../../../node_modules/.pnpm/next@1.0.0/node_modules/next',
      path.join(standaloneNodeModulesDir, 'next'),
    );
    fs.symlinkSync(
      '../../../node_modules/.pnpm/react@1.0.0/node_modules/react',
      path.join(standaloneNodeModulesDir, 'react'),
    );
    fs.symlinkSync(
      '.pnpm/next@1.0.0/node_modules/next',
      path.join(appNodeModulesDir, 'next'),
    );
    fs.symlinkSync(
      '.pnpm/react@1.0.0/node_modules/react',
      path.join(appNodeModulesDir, 'react'),
    );

    const outputDir = path.join(tempRoot, 'output', 'server');
    materializeNextStandalone({ standaloneDir, appNodeModulesDir, outputDir });

    assert.equal(fs.existsSync(path.join(outputDir, 'server.js')), true);
    assert.equal(fs.existsSync(path.join(outputDir, '.next', 'BUILD_ID')), true);
    assert.equal(
      fs.existsSync(path.join(outputDir, 'node_modules', 'next', 'dist', 'shared', 'lib', 'utils.js')),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(
          outputDir,
          'node_modules',
          '@swc',
          'helpers',
          'lib',
          '_async_to_generator.js',
        ),
      ),
      true,
    );
    assert.equal(fs.existsSync(path.join(outputDir, 'node_modules', 'react', 'index.js')), true);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
