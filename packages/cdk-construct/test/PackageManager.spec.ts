/// <reference types="jest" />
import fs from 'fs';
import path from 'path';

const packageRoot = path.resolve(__dirname, '..');

function readPackageFile(relativePath: string) {
  return fs.readFileSync(path.join(packageRoot, relativePath), 'utf8');
}

describe('cdk-construct package manager configuration', () => {
  it('pins pnpm and node 22 in the projen source', () => {
    const projenrc = readPackageFile('.projenrc.js');

    expect(projenrc).toContain('packageManager: javascript.NodePackageManager.PNPM');
    expect(projenrc).toContain("pnpmVersion: '10'");
    expect(projenrc).toContain("minNodeVersion: '22.0.0'");
  });
});
