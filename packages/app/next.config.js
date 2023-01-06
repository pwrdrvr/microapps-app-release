/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const path = require('path');
// next-compose-plugins
// const withPlugins = require('next-compose-plugins');
// next-images
// const withImages = require('next-images')

// const crypto = require('crypto');
const isProd = process.env.NODE_ENV === 'production';

const BASE_PREFIX_APP = '/release';
const BASE_VERSION_ONLY = '/0.0.0';
const BASE_PREFIX_APP_WITH_VERSION = `${BASE_PREFIX_APP}${BASE_VERSION_ONLY}`;

// eslint-disable-next-line no-undef
module.exports = {
  // We want the app under the app name like /release
  basePath: BASE_PREFIX_APP,

  // We want the static assets, api calls, and _next/data calls
  // to have /release/0.0.0/ as the prefix so they route cleanly
  // to an isolated folder on the S3 bucket and to a specific
  // lambda URL without having to do any path manipulation
  assetPrefix: isProd ? BASE_PREFIX_APP_WITH_VERSION : undefined,

  publicRuntimeConfig: {
    // Will be available on both server and client
    apiPrefix: isProd ? BASE_PREFIX_APP_WITH_VERSION : BASE_PREFIX_APP,
    basePath: BASE_PREFIX_APP,
  },

  // Get the _next/data calls rebased with the version
  // This requires custom Next.js routing in the Origin Request
  // Lambda function
  async generateBuildId() {
    return BASE_VERSION_ONLY.slice(1);
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
        destination: `/_next/:path*`,
      },
      {
        /** Images */
        source: `${BASE_VERSION_ONLY}/images/:query*`,
        destination: `/_next/image/:query*`,
      },
      /** Api Calls */
      {
        source: `${BASE_VERSION_ONLY}/api/:path*`,
        destination: `/api/:path*`,
      },
    ];
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
