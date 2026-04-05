import fs from 'node:fs';
import path from 'node:path';

const version = process.argv[2]?.trim();

if (!version) {
  throw new Error('Missing version argument. Usage: node scripts/set-workspace-version.mjs <version>');
}

const repoRoot = process.cwd();
const rootPackagePath = path.join(repoRoot, 'package.json');
const rootPackageJson = readJson(rootPackagePath);
const manifestPaths = new Set([rootPackagePath]);

for (const workspacePattern of normalizeWorkspacePatterns(rootPackageJson.workspaces)) {
  for (const manifestPath of expandWorkspacePattern(repoRoot, workspacePattern)) {
    manifestPaths.add(manifestPath);
  }
}

for (const manifestPath of manifestPaths) {
  const packageJson = readJson(manifestPath);
  packageJson.version = version;
  fs.writeFileSync(manifestPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeWorkspacePatterns(workspaces) {
  if (Array.isArray(workspaces)) {
    return workspaces;
  }

  return Array.isArray(workspaces?.packages) ? workspaces.packages : [];
}

function expandWorkspacePattern(rootDir, pattern) {
  if (!pattern.endsWith('/*')) {
    const manifestPath = path.join(rootDir, pattern, 'package.json');
    return fs.existsSync(manifestPath) ? [manifestPath] : [];
  }

  const workspaceDir = path.join(rootDir, pattern.slice(0, -2));
  if (!fs.existsSync(workspaceDir)) {
    return [];
  }

  return fs
    .readdirSync(workspaceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(workspaceDir, entry.name, 'package.json'))
    .filter((manifestPath) => fs.existsSync(manifestPath));
}
