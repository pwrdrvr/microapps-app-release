#!/usr/bin/env npx ts-node -T --project ./bin/tsconfig.json

import * as Program from 'commander';
import * as util from 'util';
import { exec } from 'child_process';
import * as fs from 'fs/promises';
const asyncExec = util.promisify(exec);

Program.version('1.0.0')
  .option('-n, --newversion <version>', 'New version to apply')
  .option('-l, --leave', 'Leave a copy of the modifed files as .modified')
  .parse(process.argv);

export async function UpdateVersion(): Promise<void> {
  const version = Program.newversion as string;
  const leaveFiles = Program.leave as boolean;
  const versionAndAlias = createVersions(version);
  const versionOnly = { version: versionAndAlias.version };

  const filesToModify = [
    { path: 'package.json', versions: versionOnly },
    { path: 'deploy.json', versions: versionAndAlias },
    { path: 'next.config.js', versions: versionOnly },
  ] as { path: string; versions: { version: string; alias?: string } }[];

  console.log('hello:', versionAndAlias);

  try {
    // Modify the existing files with the new version
    for (const fileToModify of filesToModify) {
      if (!(await writeNewVersions(fileToModify.path, fileToModify.versions, leaveFiles))) {
        console.log(`Failed modifying file: ${fileToModify.path}`);
      }
    }
  } catch (error) {
    console.log(`Caught exception: ${error.message}`);
  } finally {
    // Put the old files back when succeeded or failed
    for (const fileToModify of filesToModify) {
      const stats = await fs.stat(`${fileToModify.path}.original`);
      if (!stats.isFile) {
        // Remove the possibly modified file
        fs.unlink(fileToModify.path);

        // Move the original file back
        fs.rename(`${fileToModify.path}.original`, fileToModify.path);
      }
    }
  }
}

function createVersions(version: string): { version: string; alias: string } {
  return { version, alias: `v${version.replace(/\./g, '_')}` };
}

async function writeNewVersions(
  path: string,
  requiredVersions: { version: string; alias?: string },
  leaveFiles: boolean,
): Promise<boolean> {
  const stats = await fs.stat(path);
  if (!stats.isFile) {
    return false;
  }

  // Make a backup of the file
  await fs.copyFile(path, `${path}.original`);

  // File exists, check that it has the required version strings
  let fileText = await fs.readFile(path, 'utf8');

  for (const key of Object.keys(requiredVersions)) {
    const placeHolder = key === 'version' ? '0.0.0' : 'v0_0_0';
    if (fileText.indexOf(placeHolder) === -1) {
      // The required placeholder is missing
      return false;
    } else {
      fileText = fileText.replace(placeHolder, requiredVersions[key]);
    }
  }

  // Write the updated file contents
  await fs.writeFile(path, fileText, 'utf8');

  // Leave a copy of the modified file if requested
  if (leaveFiles) {
    // This copy will overwrite an existing file
    await fs.copyFile(path, `${path}.modified`);
  }

  return true;
}

Promise.all([UpdateVersion()]);
