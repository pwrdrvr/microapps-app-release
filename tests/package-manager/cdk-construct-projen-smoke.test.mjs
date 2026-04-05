import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

test('cdk-construct pins the JS-only pnpm, projen, cdk, and node floor', () => {
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
  assert.doesNotMatch(projenrc, /publishToPypi/);
  assert.doesNotMatch(projenrc, /publishToNuget/);
  assert.doesNotMatch(projenrc, /publishToMaven/);
  assert.equal(packageJson.engines.node, '>= 22.0.0');
  assert.equal(packageJson.packageManager, undefined);
  assert.equal(packageJson.devEngines, undefined);
  assert.equal(packageJson.devDependencies.projen, '0.99.34');
  assert.equal(packageJson.devDependencies['aws-cdk-lib'], '2.248.0');
  assert.equal(packageJson.devDependencies.constructs, '10.5.1');
  assert.equal(packageJson.devDependencies.jsii, '^5.9.36');
  assert.equal(packageJson.devDependencies['jsii-docgen'], '^10.11.15');
  assert.equal(packageJson.peerDependencies['aws-cdk-lib'], '^2.248.0');
  assert.equal(packageJson.peerDependencies.constructs, '^10.5.1');
  assert.equal(packageJson.scripts['build:jsii'], 'npx projen compile');
  assert.equal(packageJson.scripts['build:jsii-package'], 'npx projen package:js');
  assert.equal(packageJson.scripts['build:jsii-release'], 'pnpm run build:jsii && pnpm run build:jsii-docgen && pnpm run build:jsii-package');
  assert.ok(!('package:python' in packageJson.scripts));
  assert.ok(!('package:java' in packageJson.scripts));
  assert.ok(!('package:dotnet' in packageJson.scripts));
  assert.deepEqual(packageJson.jsii.targets, {});
});
