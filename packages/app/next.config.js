/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const path = require('path');
// next-compose-plugins
// const withPlugins = require('next-compose-plugins');
// next-images
// const withImages = require('next-images')

const crypto = require('crypto');

const BASE_PREFIX_APP = '/release';
const BASE_VERSION_ONLY = '/0.0.0'
const BASE_PREFIX_APP_WITH_VERSION = `${BASE_PREFIX_APP}${BASE_VERSION_ONLY}`;

// eslint-disable-next-line no-undef
module.exports = {
  target: 'serverless',

  // We want the app under the app name like /release
  basePath: BASE_PREFIX_APP,

  // We want the static assets, api calls, and _next/data calls
  // to have /release/0.0.0/ as the prefix so they route cleanly
  // to an isolated folder on the S3 bucket and to a specific
  // lambda URL without having to do any path manipulation
  assetPrefix: BASE_PREFIX_APP_WITH_VERSION,

  publicRuntimeConfig: {
    // Will be available on both server and client
    apiPrefix: BASE_PREFIX_APP_WITH_VERSION,
  },

  async redirects() {
    return [
      // assetPrefix breaks webpack-hmr, so we fix it here.
      // See: https://github.com/vercel/next.js/issues/18080
      // redirects is used because rewrites does not work for webpack-hmr
      {
        source: '/:any*/_next/webpack-hmr:path*',
        destination: '/_next/webpack-hmr:path*',
        permanent: false,
      },
    ];
  },

  // Strip the version out of the path
  // When static assets reach S3 they will still have the version
  // in the path, which is perfect because that's where the assets
  // will be on the S3 bucket.
  async rewrites() {
    return [
      {
        /** Static Assets and getServerSideProps (_next/data/) */
        source: `${BASE_VERSION_ONLY}/_next/:path*`,
        destination: `/_next/:path*`
      },
      {
        /** Images */
        source: `${BASE_VERSION_ONLY}/images/:query*`,
        destination: `/_next/image/:query*`
      },
      /** Api Calls */
      {
        source: `${BASE_VERSION_ONLY}/api/:path*`,
        destination: `/api/:path*`
      }
    ]
  },
  webpack: (config, { dev, isServer }) => {
    if (isServer && config.name === 'server' && !dev) {
      config.optimization.minimize = true;

      config.optimization.moduleIds = 'named';

      // config.optimization.splitChunks = {
      //   // Keep main and _app chunks unsplitted in webpack 5
      //   // as we don't need a separate vendor chunk from that
      //   // and all other chunk depend on them so there is no
      //   // duplication that need to be pulled out.
      //   chunks: (chunk) => !/^(polyfills|main|pages\/_app|pages\/_document)$/.test(chunk.name),
      //   cacheGroups: {
      //     // framework: {
      //     //   chunks: "all",
      //     //   name: "framework",
      //     //   test(module) {
      //     //     const resource = module.nameForCondition == null ? void 0 : module.nameForCondition();
      //     //     return resource ? topLevelFrameworkPaths.some((pkgPath) => resource.startsWith(pkgPath)) : false;
      //     //   },
      //     //   priority: 40,
      //     //   // Don't let webpack eliminate this chunk (prevents this chunk from
      //     //   // becoming a part of the commons chunk)
      //     //   enforce: true
      //     // },
      //     lib: {
      //       test(module) {
      //         return module.size() > 160000 && /node_modules[/\\]/.test(module.nameForCondition() || "");
      //       },
      //       name(module) {
      //         const hash = crypto.createHash("sha1");
      //         if (isModuleCSS(module)) {
      //           module.updateHash(hash);
      //         } else {
      //           if (!module.libIdent) {
      //             throw new Error(`Encountered unknown module type: ${module.type}. Please open an issue.`);
      //           }
      //           hash.update(module.libIdent({
      //             context: dir
      //           }));
      //         }
      //         return hash.digest("hex").substring(0, 8);
      //       },
      //       priority: 30,
      //       minChunks: 1,
      //       reuseExistingChunk: true
      //     }
      //   },
      //   maxInitialRequests: 25,
      //   minSize: 20000
      // };
    }

    return config;
  },
};
