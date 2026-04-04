const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

const BASE_PREFIX_APP = '/release';
const BASE_VERSION_ONLY = '/0.0.0';
const BASE_PREFIX_APP_WITH_VERSION = `${BASE_PREFIX_APP}${BASE_VERSION_ONLY}`;

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  output: 'standalone',
  basePath: BASE_PREFIX_APP,
  assetPrefix: BASE_PREFIX_APP_WITH_VERSION,
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
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
