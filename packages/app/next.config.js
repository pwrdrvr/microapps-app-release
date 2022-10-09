/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const path = require('path');
// next-compose-plugins
// const withPlugins = require('next-compose-plugins');
// next-images
// const withImages = require('next-images')

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
