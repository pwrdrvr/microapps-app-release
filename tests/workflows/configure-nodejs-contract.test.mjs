import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

test('configure-nodejs action stays wired to the shared manager resolver contract', () => {
  const action = fs.readFileSync(
    path.join(repoRoot, '.github', 'actions', 'configure-nodejs', 'action.yml'),
    'utf8',
  );

  assert.match(action, /actions\/setup-node@v5/);
  assert.match(action, /actions\/cache@v5/);
  assert.match(action, /default:\s*"22\.x"/);
  assert.match(action, /scripts\/package-manager\/resolve-manager\.mjs/);
  assert.match(action, /corepack enable/);
  assert.match(action, /installCommand/);
});
