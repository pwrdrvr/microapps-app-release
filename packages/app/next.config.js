/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const dropClientPagePlugin = require('next/dist/build/webpack/plugins/next-drop-client-page-plugin');
// next-compose-plugins
// const withPlugins = require('next-compose-plugins');
// next-images
// const withImages = require('next-images')

const appRoot = '/release/0.0.0';

// eslint-disable-next-line no-undef
module.exports = {
  // target: 'serverless',
  // target: 'server',
  // sassOptions: {
  //   includePaths: [path.join(__dirname, 'styles')],
  // },
  // We run lint manually so do not need to run it again
  eslint: {
    // Linting is handled already, we do not need the built in check
    ignoreDuringBuilds: true,
  },
  // cleanDistDir: false,
  webpack: (config, { dev, isServer }) => {
    //   config.resolve.modules.push(path.resolve('./'));
    //   return config;

    // config.entry looks lke this:
    // entry: async ()=>{
    //   return {
    //     ...clientEntries ? clientEntries : {},
    //     ...entrypoints
    // };

    if (isServer) {
      const origEntry = config.entry;

      config.entry = async () => {
        const origEntries = await origEntry();

        //
        // This results in more bundling of node_modules,
        // but the prerender requests fail for 404/500 & sb-examples/Page with an error that indicates
        // that we may have multiple copies of React in memory
        //
        //[==  ] info  - Generating static pages (2/3)
        // Error occurred prerendering page "/500". Read more: https://nextjs.org/docs/messages/prerender-error
        // TypeError: Cannot destructure property 'inAmpMode' of '(0 , _react).useContext(...)' as it is null.
        // at Html (/Users/hhunt/github/pwrdrvr/microapps-app-release/packages/app/.next/server/chunks/13.js:616:13)
        // at d (/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/react-dom/cjs/react-dom-server.node.production.min.js:33:498)
        //
        //

        //
        // if (config.name === 'server') {
        //   config.externals = [
        //     // {
        //     //   '@builder.io/partytown': {},
        //     //   'next/dist/compiled/etag': {},
        //     //   'next/dist/compiled/chalk': {},
        //     //   'react-dom': {},
        //     // },
        //     'react',
        //     'react-dom',
        //     'next',
        //     'aws-crt',
        //     // 'react',
        //     // 'react-dom',
        //     // '@builder.io/partytown',
        //   ];

        console.log(`\n\n\n${config.name}\n\n\n`);
        // console.log('config.externals', config.externals);
        // console.log('config.resolve.alias', config.resolve.alias);
        // console.log('config.resolve.modules', config.resolve.modules);
        // console.log('config', config);

        if (config.name === 'server') {
          config.externals = ['next/dist/server/next-server', ...config.externals];
          // Drop the amp pages like edge-server does
          // This might fix the `TypeError: Cannot destructure property 'inAmpMode' of '(0 , _react).useContext(...)' as it is null.` error
          // config.plugins = [
          //   ...config.plugins.slice(0, 2),
          //   new dropClientPagePlugin.DropClientPage(),
          //   ...config.plugins.slice(2),
          // ];
          // console.log('after modifying plugins', config.plugins);
          // config.externals = ['next', 'react', 'react-dom', 'next', 'aws-crt'];
          // config.resolve.alias = {
          //   next: '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next',
          //   'private-next-pages':
          //     '/Users/hhunt/github/pwrdrvr/microapps-app-release/packages/app/src/pages',
          //   'private-dot-next':
          //     '/Users/hhunt/github/pwrdrvr/microapps-app-release/packages/app/.next',
          //   unfetch$:
          //     '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next/dist/build/polyfills/fetch/index.js',
          //   'isomorphic-unfetch$':
          //     '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next/dist/build/polyfills/fetch/index.js',
          //   'whatwg-fetch$':
          //     '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next/dist/build/polyfills/fetch/whatwg-fetch.js',
          //   'object-assign$':
          //     '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next/dist/build/polyfills/object-assign.js',
          //   'object.assign/auto':
          //     '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next/dist/build/polyfills/object.assign/auto.js',
          //   'object.assign/implementation':
          //     '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next/dist/build/polyfills/object.assign/implementation.js',
          //   'object.assign$':
          //     '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next/dist/build/polyfills/object.assign/index.js',
          //   'object.assign/polyfill':
          //     '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next/dist/build/polyfills/object.assign/polyfill.js',
          //   'object.assign/shim':
          //     '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next/dist/build/polyfills/object.assign/shim.js',
          //   url: '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next/dist/compiled/native-url/index.js',
          //   '/Users/hhunt/github/pwrdrvr/microapps-app-release/node_modules/next/dist/shared/lib/router/utils/resolve-rewrites.js': false,
          //   setimmediate: 'next/dist/compiled/setimmediate',
          // };
        }

        //   // https://www.npmjs.com/package/next-transpile-modules#user-content-i-have-trouble-with-duplicated-dependencies-or-the-invalid-hook-call-error-in-react
        //   config.resolve.alias['react'] = path.resolve(
        //     __dirname,
        //     '..',
        //     '..',
        //     'node_modules',
        //     'react',
        //   );
        //   config.resolve.alias['react-dom'] = path.resolve(
        //     __dirname,
        //     '..',
        //     '..',
        //     'node_modules',
        //     'react-dom',
        //   );
        // }

        // Include `server.ts` only in the `server` build not in the `edge-server` build,
        // which has targets `es6` and `web`
        const extraEntries =
          config.name === 'server'
            ? {
                server: './server.ts',
              }
            : {};
        const entries = {
          ...origEntries,
          ...extraEntries,
        };
        return entries;
      };
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
