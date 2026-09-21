const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

const BASE_PREFIX_APP = '/release';
const BASE_VERSION_ONLY = '/0.0.0';
const BASE_PREFIX_APP_WITH_VERSION = `${BASE_PREFIX_APP}${BASE_VERSION_ONLY}`;

// Build- and dev-only files that Next traces into the standalone server anyway.
// Excluding them here keeps the Lambda package close to the production size budget.
const SERVER_TRACE_EXCLUDES = [
  '**/node_modules/typescript/**',
  '**/node_modules/caniuse-lite/**',
  '**/node_modules/postcss/**',
  '**/node_modules/source-map/**',
  '**/node_modules/source-map-js/**',
  '**/node_modules/sharp/**',
  '**/node_modules/@img/**',
  '**/next/dist/build/babel/**',
  // compiled/babel/code-frame.js is required at startup, but it only needs
  // compiled/babel-code-frame; the 1.3 MB Babel bundle is build-only.
  '**/next/dist/compiled/babel/bundle.js',
  '**/next/dist/compiled/babel-packages/**',
  '**/next/dist/compiled/postcss-preset-env/**',
  '**/next/dist/compiled/cssnano-simple/**',
  '**/next/dist/compiled/amphtml-validator/**',
  '**/next/dist/compiled/react-refresh/**',
  // 15.5.25 reaches this directory from the server's own startup path:
  // server/config.js -> build/next-config-ts/transpile-config.js ->
  // lib/typescript/required-packages. Excluding the whole directory, as this
  // did through 15.5.14, makes the packaged server exit on boot with
  // MODULE_NOT_FOUND and the deployed app answer 502. required-packages is a
  // ~1 KB leaf with no requires of its own; the rest is the build-time type
  // checker (diagnosticFormatter and writeConfigurationDefaults are 15 KB each).
  '**/next/dist/lib/typescript/!(required-packages).js',
  '**/next/dist/server/typescript/**',
  // The prod router requires dev/hot-reloader-types.js; the rest of dev/ pulls in
  // the webpack dev tooling, so exclude it and stop the tracer from following it.
  '**/next/dist/server/dev/!(hot-reloader-types).js',
  '**/next/dist/server/dev/*/**',
  '**/next/dist/client/dev/**',
  // Dev overlay bundle; only the dev rendering indicator requires it.
  '**/next/dist/compiled/next-devtools/**',
  '**/next/dist/next-devtools/userspace/**',
  // This is a webpack build without experimental React, so only the plain
  // app-page/app-route/pages runtimes are ever required.
  '**/next/dist/compiled/next-server/*turbo*',
  '**/next/dist/compiled/next-server/*experimental*',
  // Edge sandbox is only loaded for middleware and edge routes, and this app has neither.
  // @edge-runtime/cookies and /ponyfill are used by the Node server and stay.
  '**/next/dist/compiled/@edge-runtime/primitives/**',
  '**/next/dist/compiled/edge-runtime/**',
  '**/next/dist/server/web/sandbox/**',
  // server.js forces NODE_ENV=production, and Next renders pages with
  // react-dom/server.edge, falling back to the browser build only for old React.
  '**/node_modules/react/cjs/*.development.js',
  '**/node_modules/react-dom/cjs/*.development.js',
  '**/node_modules/react-dom/cjs/react-dom-server.browser.*',
];

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  output: 'standalone',
  basePath: BASE_PREFIX_APP,
  assetPrefix: BASE_PREFIX_APP_WITH_VERSION,
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  outputFileTracingExcludes: {
    '*': SERVER_TRACE_EXCLUDES,
  },
  images: {
    unoptimized: true,
  },
  async generateBuildId() {
    return BASE_VERSION_ONLY.slice(1);
  },
  async rewrites() {
    const afterFilesAlways = [
      {
        source: `${BASE_VERSION_ONLY}/api/:path*`,
        destination: `/api/:path*`,
      },
    ];

    if (isProd) {
      return {
        afterFiles: [...afterFilesAlways],
      };
    }

    return {
      beforeFiles: [
        {
          source: `${BASE_VERSION_ONLY}/_next/static/:path*`,
          destination: `/_next/static/:path*`,
        },
        {
          source: `${BASE_VERSION_ONLY}/static/:path*`,
          destination: `/static/:path*`,
        },
      ],
      afterFiles: [...afterFilesAlways],
    };
  },
};
