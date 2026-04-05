import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

test('root package metadata pins pnpm and node 22', () => {
  const packageJson = readJson('package.json');

  assert.equal(packageJson.packageManager, 'pnpm@10.29.3');
  assert.deepEqual(packageJson.engines, { node: '>= 22.0.0' });
  assert.equal(packageJson.pnpm?.overrides?.['class-transformer'], '0.5.1');
});

test('workspace metadata and lockfiles reflect pnpm-first development', () => {
  const workspace = fs.readFileSync(path.join(repoRoot, 'pnpm-workspace.yaml'), 'utf8');

  assert.match(workspace, /packages:\s*\n\s*-\s*"packages\/\*"/);
  assert.equal(fs.existsSync(path.join(repoRoot, 'package-lock.json')), false);
  assert.equal(fs.existsSync(path.join(repoRoot, 'packages', 'app', 'package-lock.json')), false);
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'packages', 'cdk-construct', 'package-lock.json')),
    false,
  );
});

test('root scripts no longer shell through npm workspace helpers', () => {
  const packageJson = readJson('package.json');

  for (const [name, value] of Object.entries(packageJson.scripts)) {
    assert.ok(
      !value.includes('npm -w') && !value.includes('npm exec --workspaces'),
      `${name} still uses npm workspace helpers: ${value}`,
    );
  }
});

test('cdk-stack consumes the local construct package via the workspace protocol', () => {
  const packageJson = readJson(path.join('packages', 'cdk-stack', 'package.json'));

  assert.equal(
    packageJson.devDependencies['@pwrdrvr/microapps-app-release-cdk'],
    'workspace:*',
  );
});
