import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

test('cdk-construct pins the core-aligned pnpm, projen, cdk, and node floor', () => {
  const projenrc = fs.readFileSync(
    path.join(repoRoot, 'packages', 'cdk-construct', '.projenrc.js'),
    'utf8',
  );
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'packages', 'cdk-construct', 'package.json'), 'utf8'),
  );

  assert.match(projenrc, /packageManager:\s+javascript\.NodePackageManager\.PNPM/);
  assert.match(projenrc, /pnpmVersion:\s+'10'/);
  assert.match(projenrc, /minNodeVersion:\s+'22\.0\.0'/);
  assert.equal(packageJson.engines.node, '>= 22.0.0');
  assert.equal(packageJson.devDependencies.projen, '0.98.10');
  assert.equal(packageJson.devDependencies['aws-cdk-lib'], '2.168.0');
  assert.equal(packageJson.peerDependencies['aws-cdk-lib'], '^2.168.0');
  assert.equal(packageJson.scripts['build:jsii'], 'npx projen compile');
  assert.equal(packageJson.scripts['build:jsii-all'], 'pnpm run build:jsii && pnpm run build:jsii-docgen && pnpm run build:jsii-pacmak');
});
