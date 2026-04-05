import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(__dirname, 'set-workspace-version.mjs');

test('sets the root and workspace package versions together', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'set-workspace-version-'));
  const appDir = path.join(tempDir, 'packages', 'app');
  const stackDir = path.join(tempDir, 'packages', 'stack');

  fs.mkdirSync(appDir, { recursive: true });
  fs.mkdirSync(stackDir, { recursive: true });

  writeJson(path.join(tempDir, 'package.json'), {
    name: 'root',
    private: true,
    version: '0.0.0',
    workspaces: ['packages/*'],
  });
  writeJson(path.join(appDir, 'package.json'), { name: 'app', version: '0.0.0' });
  writeJson(path.join(stackDir, 'package.json'), { name: 'stack', version: '0.0.0' });

  const result = spawnSync(process.execPath, [scriptPath, '1.2.3'], {
    cwd: tempDir,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readJson(path.join(tempDir, 'package.json')).version, '1.2.3');
  assert.equal(readJson(path.join(appDir, 'package.json')).version, '1.2.3');
  assert.equal(readJson(path.join(stackDir, 'package.json')).version, '1.2.3');
});

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
