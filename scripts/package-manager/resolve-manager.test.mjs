import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(__dirname, 'resolve-manager.mjs');

function withTempRepo(files, callback) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'resolve-manager-'));

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(cwd, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }

  try {
    return callback(cwd);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

function runResolver(cwd, extraArgs = []) {
  return JSON.parse(
    execFileSync(process.execPath, [scriptPath, '--cwd', cwd, ...extraArgs], {
      encoding: 'utf8',
    }),
  );
}

test('resolves the manager from package.json when pnpm is pinned', () => {
  withTempRepo(
    {
      'package.json': JSON.stringify({ packageManager: 'pnpm@10.29.3' }),
      'pnpm-lock.yaml': 'lockfileVersion: 9.0\n',
    },
    (cwd) => {
      const result = runResolver(cwd);

      assert.equal(result.packageManager, 'pnpm');
      assert.equal(result.packageManagerVersion, '10.29.3');
      assert.equal(result.lockfileName, 'pnpm-lock.yaml');
      assert.equal(result.installCommand, 'pnpm install --frozen-lockfile');
      assert.equal(result.needsCorepack, 'true');
    },
  );
});

test('supports explicit npm override', () => {
  withTempRepo(
    {
      'package.json': JSON.stringify({ packageManager: 'pnpm@10.29.3' }),
      'package-lock.json': '{}',
      'pnpm-lock.yaml': 'lockfileVersion: 9.0\n',
    },
    (cwd) => {
      const result = runResolver(cwd, ['--package-manager', 'npm']);

      assert.equal(result.packageManager, 'npm');
      assert.equal(result.installCommand, 'npm ci');
      assert.equal(result.needsCorepack, 'false');
      assert.equal(result.lockfileName, 'package-lock.json');
    },
  );
});

test('fails clearly when multiple lockfiles exist without a pinned manager', () => {
  withTempRepo(
    {
      'package.json': JSON.stringify({}),
      'package-lock.json': '{}',
      'pnpm-lock.yaml': 'lockfileVersion: 9.0\n',
    },
    (cwd) => {
      const result = spawnSync(process.execPath, [scriptPath, '--cwd', cwd], {
        encoding: 'utf8',
      });

      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Found multiple lockfiles/);
    },
  );
});
