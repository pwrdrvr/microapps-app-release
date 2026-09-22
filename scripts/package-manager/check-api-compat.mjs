#!/usr/bin/env node

// Runs jsii-diff between the published construct's assembly and the one this
// branch builds, and fails on breaking changes to the stable API. Allow a
// deliberate break by adding the key jsii-diff prints (e.g.
// `removed:@pwrdrvr/microapps-app-release-cdk.MicroAppsAppReleaseProps.nodeEnv`)
// to packages/cdk-construct/.compatignore, which projen's `compat` task reads too.
//
// This compares against the tarball check-tarball-population.mjs has already
// fetched with `npm pack`, rather than running projen's `compat` task. That task
// hands jsii-diff an `npm:<package>` spec, and jsii-diff resolves it with a bare
// `npm install` of the package and its peers into a temp directory: no
// lockfile, no minimumReleaseAge, lifecycle scripts enabled. That bypasses every
// control pnpm-workspace.yaml puts on installs on the runner. Here the baseline's
// dependencies (aws-cdk-lib, constructs) resolve from the construct's own
// lockfile-pinned node_modules instead.
//
// Releases 0.3.0 through 0.6.0 shipped without `.jsii`, so until one that
// restores it is published there is nothing to compare against and the check
// skips with a notice.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = process.cwd();
const packageDir = path.join(rootDir, 'packages', 'cdk-construct');
const reportPath =
  process.env.TARBALL_POPULATION_JSON ?? path.join(rootDir, 'tarball-population.json');

export function planApiCompat({ publishedVersion, publishedTarballPath, publishedFiles }) {
  if (!publishedTarballPath) {
    return { run: false, reason: 'No published baseline to compare against' };
  }
  if (!publishedFiles.includes('.jsii')) {
    return {
      run: false,
      reason: `Published ${publishedVersion} has no .jsii assembly, so jsii-diff has nothing to compare against`,
    };
  }
  return { run: true, reason: `Comparing against published ${publishedVersion}` };
}

function runCli() {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const [published] = report.packages;
  const { publishedVersion, publishedTarballPath } = published;

  if (publishedTarballPath && !existsSync(publishedTarballPath)) {
    throw new Error(
      `Published tarball ${publishedTarballPath} no longer exists. Run check-tarball-population.mjs ` +
        'with TARBALL_POPULATION_BASELINE_DIR (or KEEP_TARBALL_POPULATION_WORKDIR=1) so it is kept.',
    );
  }

  const plan = planApiCompat({
    publishedVersion,
    publishedTarballPath,
    publishedFiles: publishedTarballPath ? listTarballFiles(publishedTarballPath) : [],
  });

  if (!plan.run) {
    notice(`${plan.reason}; skipping the API compatibility check.`);
    return 0;
  }

  console.log(`${plan.reason}.`);
  const baselineDir = mkdtempSync(path.join(tmpdir(), 'api-compat-'));
  try {
    run('tar', ['-xzf', publishedTarballPath, '-C', baselineDir, 'package/.jsii', 'package/package.json']);
    // Node resolution walks up from the extracted package to this link.
    symlinkSync(path.join(packageDir, 'node_modules'), path.join(baselineDir, 'node_modules'), 'dir');

    const result = spawnSync(
      path.join(packageDir, 'node_modules', '.bin', 'jsii-diff'),
      [path.join(baselineDir, 'package'), '.', '--keys', '--ignore-file', '.compatignore'],
      { cwd: packageDir, stdio: 'inherit', env: process.env },
    );
    if (result.error) {
      throw result.error;
    }
    return result.status ?? 1;
  } finally {
    rmSync(baselineDir, { recursive: true, force: true });
  }
}

function listTarballFiles(tarballPath) {
  return run('tar', ['-tzf', tarballPath], { capture: true })
    .stdout.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^package\//, ''));
}

function notice(message) {
  console.log(process.env.GITHUB_ACTIONS === 'true' ? `::notice title=API compatibility::${message}` : message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim();
    throw new Error(`${command} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }

  return result;
}

const isCliEntrypoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliEntrypoint) {
  process.exitCode = runCli();
}
