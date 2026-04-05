import fs from 'node:fs';
import path from 'node:path';

export function materializeNextStandalone({
  standaloneDir,
  outputDir,
}) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  for (const entry of fs.readdirSync(standaloneDir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') {
      continue;
    }

    fs.cpSync(path.join(standaloneDir, entry.name), path.join(outputDir, entry.name), {
      recursive: true,
      force: true,
    });
  }

  for (const relativeNodeModulesDir of listNodeModulesDirs(standaloneDir)) {
    const sourceNodeModulesDir = path.join(standaloneDir, relativeNodeModulesDir);
    const outputNodeModulesDir = path.join(outputDir, relativeNodeModulesDir);

    fs.rmSync(outputNodeModulesDir, { recursive: true, force: true });
    fs.mkdirSync(outputNodeModulesDir, { recursive: true });

    for (const packageName of listTopLevelPackages(sourceNodeModulesDir)) {
      const sourcePackage = path.join(sourceNodeModulesDir, packageName);
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
}

function listNodeModulesDirs(rootDir) {
  const nodeModulesDirs = [];
  collectNodeModulesDirs(rootDir, '', nodeModulesDirs);

  return nodeModulesDirs;
}

function collectNodeModulesDirs(rootDir, relativeDir, nodeModulesDirs) {
  const absoluteDir = relativeDir ? path.join(rootDir, relativeDir) : rootDir;

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const childRelativePath = relativeDir
      ? path.join(relativeDir, entry.name)
      : entry.name;

    if (entry.name === 'node_modules') {
      nodeModulesDirs.push(childRelativePath);
      continue;
    }

    collectNodeModulesDirs(rootDir, childRelativePath, nodeModulesDirs);
  }
}

function listTopLevelPackages(nodeModulesDir) {
  const packageNames = [];

  for (const entry of fs.readdirSync(nodeModulesDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) {
      continue;
    }

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
  const outputDir = args['output-dir'];

  if (!standaloneDir || !outputDir) {
    throw new Error(
      'Usage: node scripts/materialize-next-standalone.mjs --standalone-dir <dir> --output-dir <dir>',
    );
  }

  materializeNextStandalone({
    standaloneDir,
    outputDir,
  });
}
