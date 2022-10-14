/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const path = require('path');
// next-compose-plugins
// const withPlugins = require('next-compose-plugins');
// next-images
// const withImages = require('next-images')

const crypto = require('crypto');

const appRoot = '/release/0.0.0';

// eslint-disable-next-line no-undef
module.exports = {
  target: 'serverless',
  // sassOptions: {
  //   includePaths: [path.join(__dirname, 'styles')],
  // },
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
  basePath: appRoot,
  // assetPrefix doesn't appear to do much
  // assetPrefix: '/app/1.2.3',
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: appRoot,
  },
};
