#!/usr/bin/env node
// Audits `pnpm-lock.yaml` for anything that would put non-registry code on a
// developer machine or a GitHub Actions runner, and verifies that the install
// hooks which are supposed to prevent that are still in force.
//
// ── Why the lockfile, and not just the pnpmfile ─────────────────────────────
//
// `.pnpmfile.cjs` blocks git specs at resolution time, which is the right place
// to stop one. But CI never resolves: every workflow installs through
// `pwrdrvr/configure-nodejs`, which runs `pnpm install --frozen-lockfile`, and a
// frozen install reads `pnpm-lock.yaml` and does what it says. The lockfile is
// therefore the thing CI actually executes, and a git resolution appearing
// there is both necessary and sufficient for git-sourced code to reach the
// runner — however it got in, and whichever hook failed to stop it.
//
// So this check reads the artifact rather than trusting the control, and it also
// checks the control: `pnpmfileChecksum` in the lockfile must be the SHA-256 of
// the committed `.pnpmfile.cjs`, so the hook cannot be weakened, emptied or
// deleted without a visible lockfile diff.
//
// Checks, in order of what they catch:
//
//   1. Git resolutions in `packages:` — `type: git`, a `repo:`/`commit:` pair,
//      or a codeload tarball from a git host.
//   2. Git specifiers in `importers:` — what a first-party package.json asked
//      for, which catches a git dep whose resolution shape this script has not
//      seen before.
//   3. `.npmrc` must still neutralise any user-level global pnpmfile, or the
//      checksum below stops being portable and `--frozen-lockfile` starts
//      failing for whoever has one.
//   4. `pnpmfileChecksum` must match `.pnpmfile.cjs`.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Resolution shapes pnpm writes for git-sourced packages. `tarball:` is the
// codeload form used for every GitHub/GitLab/Bitbucket spec — including
// `git+https://github.com/...`, which despite its name never reaches pnpm's
// `git` fetcher (measured on pnpm 10.29.3).
const GIT_RESOLUTION_PATTERNS = [
  { label: 'git resolution', pattern: /resolution:\s*\{\s*type:\s*git\b/ },
  { label: 'git repo resolution', pattern: /^\s+repo:\s*\S/ },
  {
    label: 'git-host tarball resolution',
    pattern: /resolution:\s*\{\s*tarball:\s*https?:\/\/(?:[\w.-]+\.)?(?:github|gitlab|bitbucket)\b/,
  },
  { label: 'codeload tarball resolution', pattern: /resolution:\s*\{\s*tarball:\s*https?:\/\/codeload\./ },
];

// The same spec shapes `.pnpmfile.cjs` refuses, applied to the `specifier:`
// lines pnpm records for first-party manifests.
const GIT_SPECIFIER_PATTERN =
  /^(?:git(?:\+|:)|git@|ssh:\/\/git@|github:|gitlab:|bitbucket:|https?:\/\/(?:www\.)?(?:github|gitlab|bitbucket)\.com\/)/;

/** Git-sourced resolutions anywhere in the lockfile, as `{ line, label, text }`. */
export function findGitResolutions(lockfile) {
  const findings = [];
  const lines = lockfile.split('\n');

  for (const [index, raw] of lines.entries()) {
    const line = raw.replace(/\r$/, '');
    for (const { label, pattern } of GIT_RESOLUTION_PATTERNS) {
      if (pattern.test(line)) {
        findings.push({ line: index + 1, label, text: line.trim() });
        break;
      }
    }
  }

  return findings;
}

/**
 * Git specifiers recorded for first-party packages, as
 * `{ line, importer, name, specifier }`.
 *
 * Only the `importers:` block is read: those `specifier:` values are what our
 * own package.json files asked for. Transitive packages do not appear there.
 */
export function findGitSpecifiers(lockfile) {
  const findings = [];
  const lines = lockfile.split('\n');
  let inImporters = false;
  let importer = '<root>';
  let depName;

  for (const [index, raw] of lines.entries()) {
    const line = raw.replace(/\r$/, '');

    if (/^importers:\s*$/.test(line)) {
      inImporters = true;
      continue;
    }
    if (!inImporters) continue;
    // Any other column-0 key ends the block.
    if (/^\S/.test(line)) break;

    const importerKey = /^ {2}(\S.*?):\s*$/.exec(line);
    if (importerKey) {
      importer = unquote(importerKey[1]);
      continue;
    }

    const depKey = /^ {6}(\S.*?):\s*$/.exec(line);
    if (depKey) {
      depName = unquote(depKey[1]);
      continue;
    }

    const specifier = /^ {8}specifier:\s*(.+?)\s*$/.exec(line);
    if (specifier) {
      const value = unquote(specifier[1]);
      if (GIT_SPECIFIER_PATTERN.test(value)) {
        findings.push({ line: index + 1, importer, name: depName ?? '<unknown>', specifier: value });
      }
    }
  }

  return findings;
}

/** `sha256-<base64>` over `contents`, the format pnpm writes for pnpmfileChecksum. */
export function pnpmfileChecksum(contents) {
  return `sha256-${createHash('sha256').update(contents).digest('base64')}`;
}

/** The `pnpmfileChecksum` recorded in the lockfile, or undefined. */
export function readLockfileChecksum(lockfile) {
  const match = /^pnpmfileChecksum:\s*(\S+)\s*$/m.exec(lockfile);
  return match?.[1];
}

/** Whether `.npmrc` neutralises any user-level global pnpmfile. */
export function neutralisesGlobalPnpmfile(npmrc) {
  return /^\s*global-pnpmfile\s*=\s*$/m.test(npmrc);
}

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function runCli() {
  const lockfile = readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8');
  const pnpmfile = readFileSync(join(repoRoot, '.pnpmfile.cjs'));
  const npmrc = readFileSync(join(repoRoot, '.npmrc'), 'utf8');

  const problems = [];

  for (const { line, label, text } of findGitResolutions(lockfile)) {
    problems.push(`pnpm-lock.yaml:${line}: ${label} — ${text}`);
  }

  for (const { line, importer, name, specifier } of findGitSpecifiers(lockfile)) {
    problems.push(`pnpm-lock.yaml:${line}: git specifier ${name}@${specifier} in importer "${importer}"`);
  }

  if (!neutralisesGlobalPnpmfile(npmrc)) {
    problems.push(
      '.npmrc no longer sets `global-pnpmfile=`. Without it the lockfile\'s ' +
        'pnpmfileChecksum depends on each contributor\'s personal hook, and ' +
        '`pnpm install --frozen-lockfile` fails with ERR_PNPM_LOCKFILE_CONFIG_MISMATCH ' +
        'for anyone who has one.',
    );
  }

  const expected = pnpmfileChecksum(pnpmfile);
  const actual = readLockfileChecksum(lockfile);
  if (actual === undefined) {
    problems.push(
      'pnpm-lock.yaml records no `pnpmfileChecksum`, but .pnpmfile.cjs exists. ' +
        'Every `pnpm install --frozen-lockfile` will fail with ' +
        'ERR_PNPM_LOCKFILE_CONFIG_MISMATCH. Run `pnpm install --lockfile-only` and commit the result.',
    );
  } else if (actual !== expected) {
    problems.push(
      `pnpm-lock.yaml's pnpmfileChecksum (${actual}) does not match .pnpmfile.cjs (${expected}). ` +
        'Either the hook was edited without regenerating the lockfile — run ' +
        '`pnpm install --lockfile-only` — or it was changed by someone who did not want the diff seen.',
    );
  }

  if (problems.length > 0) {
    console.error(
      [
        '[check-lockfile-sources] the lockfile is what CI installs from. These must be fixed:',
        ...problems.map((problem) => `  ${problem}`),
        '',
        'Git-sourced dependencies are refused outright in this repo: they carry no registry',
        'integrity hash, they can be repointed after review by a force-push, and fetching one',
        'runs its lifecycle scripts on every machine that installs. See .pnpmfile.cjs.',
      ].join('\n'),
    );
    process.exit(1);
  }

  console.log(
    '[check-lockfile-sources] ok — no git-sourced resolutions or specifiers; ' +
      '.npmrc neutralises user-level pnpmfiles; pnpmfileChecksum matches .pnpmfile.cjs.',
  );
}

const isCliEntrypoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliEntrypoint) {
  runCli();
}
