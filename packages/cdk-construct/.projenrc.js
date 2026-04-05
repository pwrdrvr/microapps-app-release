// eslint-disable-next-line import/no-extraneous-dependencies
const { awscdk, javascript } = require('projen');

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'PwrDrvr LLC',
  authorAddress: 'harold@pwrdrvr.com',
  authorOrganization: true,
  description:
    'Release app for the MicroApps framework, by PwrDrvr LLC. Provides the ability to control which version of an app is launched.',
  cdkVersion: '2.248.0',
  cdkVersionPinning: false,
  copyrightOwner: 'PwrDrvr LLC',
  copyrightPeriod: '2020',
  defaultReleaseBranch: 'main',
  license: 'MIT',
  name: '@pwrdrvr/microapps-app-release-cdk',
  releaseToNpm: true,
  npmAccess: javascript.NpmAccess.PUBLIC,
  packageManager: javascript.NodePackageManager.PNPM,
  pnpmVersion: '10',
  minNodeVersion: '22.0.0',
  jsiiVersion: '^5.9.36',
  projenrcTs: false,
  repositoryUrl: 'https://github.com/pwrdrvr/microapps-app-release',
  homepage: 'https://github.com/pwrdrvr/microapps-app-release',
  stability: 'stable',
  jest: false,
  keywords: ['awscdk', 'cdk', 'microapps'],
  docgen: true,
  devDeps: [
    '@types/yargs@^16.0.0',
    '@types/jest@^26.0.24',
    'eslint-import-resolver-typescript@^2.7.1',
    'eslint-plugin-import@^2.32.0',
    'jsii-diff@^1.127.0',
    'jsii-docgen@^10.11.15',
    'jsii-pacmak@^1.127.0',
    'jsii-rosetta@^5.9.38',
  ],
  peerDeps: [],
});

// The published construct bundles the built Next.js app and static assets.
project.package.addField('files', [
  'API.md',
  'README.md',
  'lib/*.js',
  'lib/*.d.ts',
  'lib/microapps-app-release/server/**/*',
  'lib/microapps-app-release/server/.next/**/*',
  'lib/microapps-app-release/server/node_modules/**/*',
  'lib/microapps-app-release/static_files/**/*',
  'package.json',
]);

// Keep package-local metadata explicit until the generated surface is fully adopted.
project.package.addField('stability', 'stable');
project.package.addField('//', 'Edit .projenrc.js as the source of truth for future construct metadata changes.');

// Keep repo-level JSII entry points explicit while the surrounding workflows consume the JS-only package flow.
project.addScripts({
  'build:jsii': 'npx projen compile',
  'build:jsii-docgen': 'npx projen docgen',
  'build:jsii-package': 'npx projen package:js',
  'build:jsii-release': 'pnpm run build:jsii && pnpm run build:jsii-docgen && pnpm run build:jsii-package',
  'cdk': 'cdk',
});

// The construct tsconfig currently needs skipLibCheck for the legacy app bundle.
project.tsconfig?.file.addOverride('compilerOptions.skipLibCheck', true);

project.npmignore?.exclude('/AGENTS.md', '/CLAUDE.md');

project.synth();
