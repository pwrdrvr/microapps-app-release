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

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  output: 'standalone',
  outputFileTracing: true,
  experimental: {
    bundleServerPackages: isProd,
  },

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
    // Rewrites needed in both Prod and Dev
    const afterFilesAlways = [
      // Api Calls
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

    // Local Development Rewrites
    return {
      beforeFiles: [
        {
          // Static Assets
          // Next.js evaluates the `source` path after removing `basePath`
          // A request for `/release/0.0.0/_next/static/...` will be rewritten
          // to `/0.0.0/_next/static/...` before the `source` is looked up for a match.
          // This is why we need to use `BASE_VERSION_ONLY` here instead of `BASE_PREFIX_APP_WITH_VERSION`
          // The destination similarly does not need to repeat the `basePath` because
          // Next.js is already adding it to any resulting URL.
          source: `${BASE_VERSION_ONLY}/_next/static/:path*`,
          destination: `/_next/static/:path*`,
        },
        {
          // Other statics including favicon
          source: `${BASE_VERSION_ONLY}/static/:path*`,
          destination: `/static/:path*`,
        },
        {
          // Images
          source: `${BASE_VERSION_ONLY}/images/:query*`,
          destination: `/_next/image/:query*`,
        },
      ],
      afterFiles: [...afterFilesAlways],
    };
  },
  webpack: (config, { dev, isServer }) => {
    if (isServer && config.name === 'server' && !dev) {
      config.optimization.minimize = true;
    }

    return config;
  },
};
