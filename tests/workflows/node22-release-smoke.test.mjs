import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

const workflowFiles = [
  '.github/workflows/ci.yml',
  '.github/workflows/r_build-app.yml',
  '.github/workflows/r_version.yml',
  '.github/workflows/jsii.yml',
  '.github/workflows/pr-closed.yml',
  '.github/workflows/release.yml',
];

const installBearingWorkflowFiles = [
  '.github/workflows/ci.yml',
  '.github/workflows/r_build-app.yml',
  '.github/workflows/jsii.yml',
  '.github/workflows/pr-closed.yml',
  '.github/workflows/release.yml',
];

test('workflow baselines stay on node 22 and avoid npm-era release plumbing', () => {
  for (const relativePath of workflowFiles) {
    const workflow = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

    assert.doesNotMatch(workflow, /node-version:\s*16\b/);
    assert.doesNotMatch(workflow, /node-version:\s*20\b/);
    assert.doesNotMatch(workflow, /package-lock\.json/);
    assert.doesNotMatch(workflow, /npm ci/);
    assert.doesNotMatch(workflow, /::set-output/);
    assert.doesNotMatch(workflow, /configure-aws-credentials@v1-node16/);
  }

  for (const relativePath of installBearingWorkflowFiles) {
    const workflow = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(workflow, /uses:\s+\.\/\.github\/actions\/configure-nodejs/);
  }
});

test('direct setup-node usage disables package-manager auto-cache', () => {
  const directSetupNodeWorkflowFiles = [
    '.github/workflows/r_version.yml',
    '.github/workflows/release.yml',
  ];

  for (const relativePath of directSetupNodeWorkflowFiles) {
    const workflow = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(workflow, /package-manager-cache:\s*false/);
  }
});

test('the construct runtime baseline is nodejs22.x', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'packages', 'cdk-construct', 'src', 'index.ts'),
    'utf8',
  );

  assert.match(source, /nodejs22\.x/);
});

test('the app packaging workflow materializes pnpm standalone dependencies before zipping', () => {
  const workflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'r_build-app.yml'), 'utf8');

  assert.match(workflow, /materialize-next-standalone\.mjs/);
  assert.doesNotMatch(workflow, /cp -R \.\/packages\/app\/\.next\/standalone/);
});
