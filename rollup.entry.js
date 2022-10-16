import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';

import externals from 'rollup-plugin-node-externals';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const production = !process.env.ROLLUP_WATCH
const LOCAL_EXTERNALS = [];
const NPM_EXTERNALS = ['fsevents', 'next'];

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
    nodeResolve({ exportConditions: ['node'] }),
    typescript({
      tsconfig: 'tsconfig.entry.json',
      sourceMap: !production,
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
  { filename: 'index', minify: false },
  { filename: 'index', minify: true },
].map(generateConfig);
