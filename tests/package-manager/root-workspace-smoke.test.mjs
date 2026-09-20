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

  // Corepack verifies this hash against the tarball it DOWNLOADS and refuses to
  // run pnpm on a mismatch, so a compromised registry response cannot swap the
  // package manager out from under a build.
  //
  // Scope, measured rather than assumed: the check happens at install time, not
  // at every invocation. A COREPACK_HOME that already holds 10.29.3 runs it
  // without re-verifying — a tampered hash still prints 10.29.3 there. So this
  // protects CI, where the runner's corepack cache is always cold, and a
  // developer's first fetch of a given version; it does not re-validate a pnpm
  // already sitting in someone's cache. Verify any change to this line against
  // a cold `COREPACK_HOME=$(mktemp -d)`, or the test will appear to pass on a
  // machine that simply had the version already.
  //
  // Regenerate with `npm view pnpm@<version> dist.integrity` and hex-encode the
  // base64 digest.
  assert.equal(
    packageJson.packageManager,
    'pnpm@10.29.3+sha512.498e1fb4cca5aa06c1dcf2611e6fafc50972ffe7189998c409e90de74566444298ffe43e6cd2acdc775ba1aa7cc5e092a8b7054c811ba8c5770f84693d33d2dc',
  );
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

test('the app keeps the Storybook webpack4 compatibility flag under node 22', () => {
  const packageJson = readJson(path.join('packages', 'app', 'package.json'));

  assert.match(packageJson.scripts['build:storybook'], /--openssl-legacy-provider/);
  assert.match(packageJson.scripts.storybook, /--openssl-legacy-provider/);
});
