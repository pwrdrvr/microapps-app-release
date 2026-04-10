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
    assert.doesNotMatch(workflow, /actions\/upload-artifact@v4/);
  }

  for (const relativePath of installBearingWorkflowFiles) {
    const workflow = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(workflow, /uses:\s+pwrdrvr\/configure-nodejs@v1/);
  }
});

test('label-gated PR workflows listen for labeled events', () => {
  const jsiiWorkflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'jsii.yml'), 'utf8');
  const ciWorkflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'ci.yml'), 'utf8');

  assert.match(jsiiWorkflow, /pull_request:\s*\n\s*branches:\s*\[main\]\s*\n\s*types:\s*\[opened, synchronize, reopened, labeled\]/);
  assert.match(ciWorkflow, /pull_request:\s*\n\s*branches:\s*\[main\]\s*\n\s*types:\s*\[opened, synchronize, reopened, labeled\]/);
});

test('jsii packaging workflows stay runner-native and npm-only', () => {
  const jsiiWorkflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'jsii.yml'), 'utf8');
  const releaseWorkflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'release.yml'), 'utf8');

  assert.match(jsiiWorkflow, /build:jsii-release/);
  assert.match(releaseWorkflow, /build:jsii-release/);
  assert.doesNotMatch(jsiiWorkflow, /superchain/);
  assert.doesNotMatch(releaseWorkflow, /superchain/);
  assert.doesNotMatch(releaseWorkflow, /publib-pypi/);
  assert.doesNotMatch(releaseWorkflow, /publib-nuget/);
  assert.doesNotMatch(releaseWorkflow, /publib-maven/);
  assert.match(releaseWorkflow, /publib-npm/);
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

test('release workflows propagate prerelease metadata through to npm publishing', () => {
  const versionWorkflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'r_version.yml'), 'utf8');
  const releaseWorkflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'release.yml'), 'utf8');

  assert.match(versionWorkflow, /isPrerelease:/);
  assert.match(versionWorkflow, /releaseChannel:/);
  assert.match(versionWorkflow, /npmDistTag:/);
  assert.match(versionWorkflow, /id:\s+releaseMetadata/);
  assert.match(versionWorkflow, /value:\s+\$\{\{\s*jobs\.version\.outputs\.npmDistTag\s*\}\}/);

  assert.match(releaseWorkflow, /echo "npmDistTag: \$\{\{\s*needs\.version\.outputs\.npmDistTag\s*\}\}"/);
  assert.match(releaseWorkflow, /Validate GitHub prerelease flag/);
  assert.match(releaseWorkflow, /EXPECTED_PRERELEASE:\s+\$\{\{\s*needs\.version\.outputs\.isPrerelease\s*\}\}/);
  assert.match(releaseWorkflow, /ACTUAL_PRERELEASE:\s+\$\{\{\s*github\.event\.release\.prerelease\s*\}\}/);
  assert.match(releaseWorkflow, /NPM_DIST_TAG:\s+\$\{\{\s*needs\.version\.outputs\.npmDistTag\s*\}\}/);
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

test('the deploy workflow unpacks the app artifact in runner temp before moving it into lib', () => {
  const workflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'ci.yml'), 'utf8');

  assert.match(workflow, /path:\s*\$\{\{\s*runner\.temp\s*\}\}\/app-artifact/);
  assert.match(workflow, /unzip -o "\$\{RUNNER_TEMP\}\/app-artifact\/nextjs\.zip" -d "\$\{RUNNER_TEMP\}\/app-unpacked"/);
  assert.match(workflow, /rm -rf "packages\/cdk-construct\/lib\/\$\{APP_CONSTRUCT_FOLDER_NAME\}"/);
  assert.match(workflow, /mv "\$\{RUNNER_TEMP\}\/app-unpacked\/\$\{APP_CONSTRUCT_FOLDER_NAME\}" "packages\/cdk-construct\/lib\/\$\{APP_CONSTRUCT_FOLDER_NAME\}"/);
});
