#!/usr/bin/env npx ts-node -T --project ./bin/tsconfig.json

import * as Program from 'commander';
import * as util from 'util';
import { exec } from 'child_process';
const asyncExec = util.promisify(exec);

Program.version('1.0.0')
  .option('-n, --newversion <version>', 'New version to apply')
  .parse(process.argv);

export async function UpdateVersion(): Promise<void> {
  const version = Program.newversion;

  console.log(`hello: ${version}`);
}

Promise.all([UpdateVersion()]);
