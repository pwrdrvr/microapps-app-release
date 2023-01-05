import getConfig from 'next/config';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import * as React from 'react';

const isProd = process.env.NODE_ENV === 'production';

export default class MyDocument extends Document {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  render() {
    const config = getConfig();
    const { publicRuntimeConfig } = config;
    const { apiPrefix, basePath } = publicRuntimeConfig;

    return (
      <Html lang="en">
        <Head>
          {/* From: https://favicon.io/favicon-generator/ */}
          <link rel="icon" href={`${isProd ? apiPrefix : basePath}/favicon.ico`} />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href={`${isProd ? apiPrefix : basePath}/apple-touch-icon.png`}
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href={`${isProd ? apiPrefix : basePath}/favicon-32x32.png`}
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href={`${isProd ? apiPrefix : basePath}/favicon-16x16.png`}
          />
          <link rel="manifest" href={`${apiPrefix}/api/webmanifest`} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
