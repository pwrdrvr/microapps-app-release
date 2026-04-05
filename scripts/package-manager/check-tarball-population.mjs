#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const rootDir = process.cwd();
const workDir = mkdtempSync(path.join(tmpdir(), 'tarball-population-'));
const publishedDir = path.join(workDir, 'published');
const localDir = path.join(workDir, 'local');
mkdirSync(publishedDir, { recursive: true });
mkdirSync(localDir, { recursive: true });

const outputJson =
  process.env.TARBALL_POPULATION_JSON ?? path.join(rootDir, 'tarball-population.json');
const outputMarkdown =
  process.env.TARBALL_POPULATION_MARKDOWN ?? path.join(rootDir, 'tarball-population.md');
const baselineDir = process.env.TARBALL_POPULATION_BASELINE_DIR ?? null;

const pkg = {
  id: 'microapps-app-release-cdk',
  npmSpec: '@pwrdrvr/microapps-app-release-cdk',
  packageDir: path.join(rootDir, 'packages', 'cdk-construct'),
  localTarballName: 'microapps-app-release-cdk',
};

if (baselineDir) {
  mkdirSync(baselineDir, { recursive: true });
}

if (process.argv.includes('--print-baseline-cache-key')) {
  console.log(`${pkg.id}-${getPublishedVersionOrPlaceholder(pkg.npmSpec)}`);
  process.exit(0);
}

try {
  const result = comparePackage(pkg);
  const report = {
    overallStatus: result.status,
    generatedAt: new Date().toISOString(),
    workDir,
    packages: [result],
  };

  writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(outputMarkdown, renderMarkdown(report));

  console.log(renderConsoleSummary(report));
} finally {
  if (process.env.KEEP_TARBALL_POPULATION_WORKDIR !== '1') {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function comparePackage(currentPkg) {
  let publishedVersion = null;

  try {
    publishedVersion = getPublishedVersion(currentPkg.npmSpec);
  } catch (error) {
    return {
      id: currentPkg.id,
      npmSpec: currentPkg.npmSpec,
      status: 'yellow',
      reason: summarizeMissingBaseline(error),
      baselineError: error.message,
      publishedVersion: null,
      publishedTarballPath: null,
      localTarballPath: null,
      publishedFileCount: 0,
      localFileCount: 0,
      publishedSymlinkCount: 0,
      localSymlinkCount: 0,
      addedPaths: [],
      removedPaths: [],
    };
  }

  const publishedBaseline = preparePublishedBaseline(currentPkg, publishedVersion);
  const localTarballPath = prepareLocalTarball(currentPkg);
  const localFiles = listTarballFiles(localTarballPath);
  const publishedSet = new Set(publishedBaseline.files);
  const localSet = new Set(localFiles);
  const addedPaths = localFiles.filter((filePath) => !publishedSet.has(filePath));
  const removedPaths = publishedBaseline.files.filter((filePath) => !localSet.has(filePath));
  const publishedSymlinkCount = publishedBaseline.symlinkCount;
  const localSymlinkCount = countTarballSymlinks(localTarballPath);
  const changedPaths = [...addedPaths, ...removedPaths];
  const status = classifyStatus({
    changedPaths,
    publishedSymlinkCount,
    localSymlinkCount,
  });

  return {
    id: currentPkg.id,
    npmSpec: currentPkg.npmSpec,
    status,
    reason: statusReason(status, changedPaths, publishedSymlinkCount, localSymlinkCount),
    publishedVersion,
    publishedTarballPath: publishedBaseline.tarballPath,
    localTarballPath,
    publishedFileCount: publishedBaseline.files.length,
    localFileCount: localFiles.length,
    publishedSymlinkCount,
    localSymlinkCount,
    addedPaths,
    removedPaths,
  };
}

function getPublishedVersion(npmSpec) {
  const result = run('npm', ['view', '--loglevel=error', npmSpec, 'version'], { capture: true });
  return result.stdout.trim();
}

function getPublishedVersionOrPlaceholder(npmSpec) {
  try {
    return getPublishedVersion(npmSpec);
  } catch {
    return 'unpublished';
  }
}

function packPublished(currentPkg, version, targetDir = path.join(publishedDir, currentPkg.id)) {
  mkdirSync(targetDir, { recursive: true });
  const result = run(
    'npm',
    ['pack', '--loglevel=error', `${currentPkg.npmSpec}@${version}`, '--pack-destination', targetDir],
    { capture: true },
  );
  const fileName = result.stdout.trim().split('\n').filter(Boolean).at(-1);
  return path.join(targetDir, fileName);
}

function preparePublishedBaseline(currentPkg, version) {
  if (!baselineDir) {
    const tarballPath = packPublished(currentPkg, version);
    return {
      tarballPath,
      files: listTarballFiles(tarballPath),
      symlinkCount: countTarballSymlinks(tarballPath),
    };
  }

  const versionDir = path.join(baselineDir, currentPkg.id, version);
  const inventoryPath = path.join(versionDir, 'inventory.json');
  mkdirSync(versionDir, { recursive: true });

  let tarballPath = firstTarballInIfExists(versionDir);
  if (!tarballPath) {
    tarballPath = packPublished(currentPkg, version, versionDir);
  }

  if (existsSync(inventoryPath)) {
    const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));
    return {
      tarballPath,
      files: inventory.files,
      symlinkCount: inventory.symlinkCount,
    };
  }

  const inventory = {
    files: listTarballFiles(tarballPath),
    symlinkCount: countTarballSymlinks(tarballPath),
  };
  writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);

  return {
    tarballPath,
    files: inventory.files,
    symlinkCount: inventory.symlinkCount,
  };
}

function prepareLocalTarball(currentPkg) {
  const sourceTarball = findJsiiTarball(currentPkg.packageDir);
  if (!sourceTarball) {
    buildJsiiTarball(currentPkg.packageDir);
  }

  const tarballPath = findJsiiTarball(currentPkg.packageDir);
  if (!tarballPath) {
    throw new Error(`No jsii tarball found in ${path.join(currentPkg.packageDir, 'dist', 'js')}`);
  }

  const targetDir = path.join(localDir, currentPkg.id);
  mkdirSync(targetDir, { recursive: true });
  const targetTarball = path.join(targetDir, path.basename(tarballPath));
  copyFileSync(tarballPath, targetTarball);
  return targetTarball;
}

function buildJsiiTarball(packageDir) {
  const pnpmCommand = resolvePnpmCommand();
  run(pnpmCommand.command, [...pnpmCommand.args, '--filter', pkg.npmSpec, 'run', 'build:jsii-release'], {
    cwd: rootDir,
  });
}

function findJsiiTarball(packageDir) {
  const jsDistDir = path.join(packageDir, 'dist', 'js');
  if (!existsSync(jsDistDir)) {
    return null;
  }

  return firstTarballInIfExists(jsDistDir);
}

function listTarballFiles(tarballPath) {
  const result = run('tar', ['-tzf', tarballPath], { capture: true });
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^package\//, ''))
    .sort();
}

function countTarballSymlinks(tarballPath) {
  const result = run('tar', ['-tvzf', tarballPath], { capture: true });
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('l')).length;
}

function classifyStatus({ changedPaths, publishedSymlinkCount, localSymlinkCount }) {
  if (publishedSymlinkCount > 0 || localSymlinkCount > 0) {
    return 'red';
  }
  if (changedPaths.length === 0) {
    return 'green';
  }
  if (changedPaths.every(isMetadataOnlyPath)) {
    return 'yellow';
  }
  return 'red';
}

function statusReason(status, changedPaths, publishedSymlinkCount, localSymlinkCount) {
  if (publishedSymlinkCount > 0 || localSymlinkCount > 0) {
    return 'Tarball contains symlinks';
  }
  if (status === 'green') {
    return 'File population matches the published tarball';
  }
  if (status === 'yellow') {
    return `Only metadata files changed: ${changedPaths.join(', ')}`;
  }
  return `Runtime file population changed: ${changedPaths.join(', ')}`;
}

function isMetadataOnlyPath(filePath) {
  return /^(README(\..+)?|CHANGELOG(\..+)?|LICENSE(\..+)?|LICENCE(\..+)?|NOTICE(\..+)?)$/i.test(
    filePath,
  );
}

function renderMarkdown(report) {
  const marker = '<!-- tarball-population-report -->';
  const icon = statusIcon(report.overallStatus);
  const lines = [
    marker,
    `## ${icon} Tarball Population Report`,
    '',
    overallBlurb(report.overallStatus),
    '',
    '| Package | Status | Published | Files | Notes |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const currentPkg of report.packages) {
    const published = currentPkg.publishedVersion ? `\`${currentPkg.publishedVersion}\`` : 'none';
    lines.push(
      `| \`${currentPkg.npmSpec}\` | ${statusIcon(
        currentPkg.status,
      )} ${currentPkg.status.toUpperCase()} | ${published} | ${currentPkg.publishedFileCount} -> ${
        currentPkg.localFileCount
      } | ${escapePipes(currentPkg.reason)} |`,
    );
  }

  lines.push('');

  for (const currentPkg of report.packages) {
    if (currentPkg.status === 'green') {
      continue;
    }

    lines.push(
      `<details><summary>${statusIcon(currentPkg.status)} \`${currentPkg.npmSpec}\` details</summary>`,
    );
    lines.push('');

    if (currentPkg.addedPaths.length > 0) {
      lines.push('Added paths in new tarball:');
      for (const filePath of currentPkg.addedPaths) {
        lines.push(`- \`${filePath}\``);
      }
      lines.push('');
    }

    if (currentPkg.removedPaths.length > 0) {
      lines.push('Removed paths from new tarball:');
      for (const filePath of currentPkg.removedPaths) {
        lines.push(`- \`${filePath}\``);
      }
      lines.push('');
    }

    if (currentPkg.publishedSymlinkCount > 0 || currentPkg.localSymlinkCount > 0) {
      lines.push(
        `Symlink count: published=${currentPkg.publishedSymlinkCount}, new=${currentPkg.localSymlinkCount}`,
      );
      lines.push('');
    }

    if (currentPkg.baselineError) {
      lines.push('Published baseline lookup error:');
      lines.push('```text');
      lines.push(currentPkg.baselineError);
      lines.push('```');
      lines.push('');
    }

    lines.push('</details>');
    lines.push('');
  }

  lines.push(`_Generated at ${report.generatedAt}_`);
  return `${lines.join('\n')}\n`;
}

function renderConsoleSummary(report) {
  const lines = [`Tarball population overall: ${report.overallStatus.toUpperCase()}`];
  for (const currentPkg of report.packages) {
    lines.push(
      `- ${currentPkg.npmSpec}: ${currentPkg.status.toUpperCase()} (${currentPkg.publishedFileCount} -> ${
        currentPkg.localFileCount
      }) ${currentPkg.reason}`,
    );
  }
  lines.push(`JSON report: ${outputJson}`);
  lines.push(`Markdown report: ${outputMarkdown}`);
  return lines.join('\n');
}

function overallBlurb(status) {
  if (status === 'green') {
    return 'No file population drift detected between the published npm tarballs and the tarballs this branch would publish.';
  }
  if (status === 'yellow') {
    return 'Only metadata file population drift was detected. The check stayed non-blocking, but the comment is calling it out.';
  }
  return 'Runtime tarball file population drift was detected. This check is blocking until the package contents are understood and fixed.';
}

function statusIcon(status) {
  if (status === 'green') {
    return '🟢';
  }
  if (status === 'yellow') {
    return '🟡';
  }
  return '🔴';
}

function escapePipes(value) {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function summarizeMissingBaseline(error) {
  const message = error.message ?? String(error);

  if (message.includes('E404')) {
    return 'No published baseline available yet';
  }

  return 'Published baseline lookup failed';
}

function firstTarballInIfExists(directory) {
  const matches = readdirSync(directory)
    .filter((entry) => entry.endsWith('.tgz'))
    .sort();
  if (matches.length === 0) {
    return null;
  }

  return path.join(directory, matches[0]);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    const detail = stderr || stdout;
    throw new Error(`${command} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }

  return result;
}

function resolvePnpmCommand() {
  const rootPackageJson = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const packageManager = rootPackageJson.packageManager;

  if (typeof packageManager === 'string' && packageManager.startsWith('pnpm@')) {
    return {
      command: 'npx',
      args: ['--yes', packageManager],
    };
  }

  return {
    command: 'pnpm',
    args: [],
  };
}
