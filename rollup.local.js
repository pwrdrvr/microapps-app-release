import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';

import externals from 'rollup-plugin-node-externals';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const production = !process.env.ROLLUP_WATCH
const LOCAL_EXTERNALS = [];
const NPM_EXTERNALS = ['compression', 'fsevents', 'next'];

const generateConfig = (input) => ({
  input: `./packages/app-entry/src/${input.filename}.ts`,
  output: {
    file: `./packages/cdk-construct/lib/microapps-app-release/${input.filename}${input.minify ? '' : '.max'}.mjs`,
    format: 'es',
    sourcemap: `./packages/cdk-construct/lib/microapps-app-release/${input.filename}${input.minify ? '' : '.max'}.mjs.map`,
  },
  plugins: [
    json(),
    commonjs(),
    externals({
      // exclude: 'some-module',
    }),
    // Export Condition Node is not a default and is necessary to get
    // uuid to select `rng.js` instead of `rng-browser.js`
    nodeResolve({ exportConditions: ['node'], preferBuiltins: false }),
    typescript({
      tsconfig: 'tsconfig.local.json',
    }),
    input.minify
      ? terser({
        compress: true,
        mangle: true,
        output: { comments: false }, // Remove all comments, which is fine as the handler code is not distributed.
      })
      : undefined,
  ],
  external: [...NPM_EXTERNALS, ...LOCAL_EXTERNALS],
  inlineDynamicImports: true,
});

export default [
  { filename: 'local-start', minify: false },
  { filename: 'local-start', minify: true },
].map(generateConfig);
