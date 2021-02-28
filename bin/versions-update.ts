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

interface IDeployConfig {
  AppName: string;
  SemVer: string;
  DefaultFile: string;
  StaticAssetsPath: string;
  LambdaARN: string;
  AWSAccountID: string;
  AWSRegion: string;
  ServerlessNextRouterPath: string;
}

interface IVersions {
  version: string;
  alias?: string;
}

async function UpdateVersion(): Promise<void> {
  const version = Program.newversion as string;
  const leaveFiles = Program.leave as boolean;
  const versionAndAlias = createVersions(version);
  const versionOnly = { version: versionAndAlias.version };

  const filesToModify = [
    { path: 'package.json', versions: versionOnly },
    { path: 'deploy.json', versions: versionAndAlias },
    { path: 'next.config.js', versions: versionOnly },
  ] as { path: string; versions: IVersions }[];

  try {
    // Modify the existing files with the new version
    for (const fileToModify of filesToModify) {
      console.log(`Patching version (${versionAndAlias.version}) into ${fileToModify.path}`);
      if (!(await writeNewVersions(fileToModify.path, fileToModify.versions, leaveFiles))) {
        console.log(`Failed modifying file: ${fileToModify.path}`);
      }
    }

    // Read in the deploy.json config file for DeployTool
    const deployConfig = JSON.parse(await fs.readFile('deploy.json', 'utf8')) as IDeployConfig;

    console.log(`Invoking serverless next.js build for ${deployConfig.AppName}/${version}`);

    // Run the serverless next.js build
    await asyncExec('npx serverless');

    if (deployConfig.ServerlessNextRouterPath !== undefined) {
      console.log('Copying Serverless Next.js router to build output directory');
      await fs.copyFile(deployConfig.ServerlessNextRouterPath, './serverless_nextjs');
    }

    // Docker, build, tag, push to ECR
    // Note: Need to already have AWS env vars set
    await publishToECR(deployConfig, versionAndAlias);

    // TODO: Create Lambda version

    // TODO: Publish Lambda version

    // TODO: Create Lambda alias pointing to version

    // TODO: Invoke DeployTool
  } catch (error) {
    console.log(`Caught exception: ${error.message}`);
  } finally {
    // Put the old files back when succeeded or failed
    for (const fileToModify of filesToModify) {
      const stats = await fs.stat(`${fileToModify.path}.original`);
      if (stats.isFile) {
        // Remove the possibly modified file
        await fs.unlink(fileToModify.path);

        // Move the original file back
        await fs.rename(`${fileToModify.path}.original`, fileToModify.path);
      }
    }
  }
}

function createVersions(version: string): IVersions {
  return { version, alias: `v${version.replaceAll('.', '_')}` };
}

async function writeNewVersions(
  path: string,
  requiredVersions: IVersions,
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
      fileText = fileText.replaceAll(placeHolder, requiredVersions[key]);
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

async function publishToECR(deployConfig: IDeployConfig, versions: IVersions): Promise<void> {
  const ECR_HOST = `${deployConfig.AWSAccountID}.dkr.ecr.${deployConfig.AWSRegion}.amazonaws.com`;
  const ECR_REPO = `app-${deployConfig.AppName}`;
  const IMAGE_TAG = `${ECR_REPO}:${versions.alias}`;

  // Make sure we're logged into ECR for the Docker push
  console.log('Logging into ECR');
  await asyncExec(
    `aws ecr get-login-password --region ${deployConfig.AWSRegion} | docker login --username AWS --password-stdin ${ECR_HOST}`,
  );

  console.log('Starting Docker build');
  await asyncExec(`docker build -f Dockerfile -t ${IMAGE_TAG}  .`);
  await asyncExec(`docker tag ${IMAGE_TAG} ${ECR_HOST}/${IMAGE_TAG}`);
  await asyncExec(`docker tag ${IMAGE_TAG} ${ECR_HOST}/${ECR_REPO}:latest`);
  console.log('Starting Docker push to ECR');
  await asyncExec(`docker push ${ECR_HOST}/${IMAGE_TAG}`);
  await asyncExec(`docker push ${ECR_HOST}/${ECR_REPO}:latest`);
}

Promise.all([UpdateVersion()]);
