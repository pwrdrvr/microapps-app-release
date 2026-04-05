import fs from 'node:fs';
import path from 'node:path';

export function materializeNextStandalone({
  standaloneDir,
  appNodeModulesDir,
  outputDir,
}) {
  const standaloneNodeModulesDir = path.join(standaloneDir, 'node_modules');
  const outputNodeModulesDir = path.join(outputDir, 'node_modules');

  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(outputNodeModulesDir, { recursive: true });

  for (const entry of fs.readdirSync(standaloneDir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') {
      continue;
    }

    fs.cpSync(path.join(standaloneDir, entry.name), path.join(outputDir, entry.name), {
      recursive: true,
      force: true,
    });
  }

  for (const packageName of listTopLevelPackages(standaloneNodeModulesDir)) {
    const sourcePackage = path.join(appNodeModulesDir, packageName);
    const virtualNodeModulesDir = path.dirname(fs.realpathSync(sourcePackage));

    for (const dependencyEntry of fs.readdirSync(virtualNodeModulesDir, { withFileTypes: true })) {
      if (dependencyEntry.name === '.bin') {
        continue;
      }

      fs.cpSync(
        path.join(virtualNodeModulesDir, dependencyEntry.name),
        path.join(outputNodeModulesDir, dependencyEntry.name),
        {
          recursive: true,
          force: true,
          dereference: true,
        },
      );
    }
  }
}

function listTopLevelPackages(nodeModulesDir) {
  const packageNames = [];

  for (const entry of fs.readdirSync(nodeModulesDir, { withFileTypes: true })) {
    if (!entry.name.startsWith('@')) {
      packageNames.push(entry.name);
      continue;
    }

    const scopeDir = path.join(nodeModulesDir, entry.name);
    for (const scopedEntry of fs.readdirSync(scopeDir, { withFileTypes: true })) {
      packageNames.push(`${entry.name}/${scopedEntry.name}`);
    }
  }

  return packageNames;
}

function parseArgs(argv) {
  const args = {};

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    const nextToken = argv[index + 1];

    if (!token.startsWith('--') || !nextToken) {
      throw new Error(`Unexpected argument sequence near "${token ?? ''}"`);
    }

    args[token.slice(2)] = nextToken;
    index += 1;
  }

  return args;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv);
  const standaloneDir = args['standalone-dir'];
  const appNodeModulesDir = args['app-node-modules'];
  const outputDir = args['output-dir'];

  if (!standaloneDir || !appNodeModulesDir || !outputDir) {
    throw new Error(
      'Usage: node scripts/materialize-next-standalone.mjs --standalone-dir <dir> --app-node-modules <dir> --output-dir <dir>',
    );
  }

  materializeNextStandalone({
    standaloneDir,
    appNodeModulesDir,
    outputDir,
  });
}
