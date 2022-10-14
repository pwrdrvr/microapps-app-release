`rollup.entry.js` has to have `next` as an external due to Sharp and PostCSS (and possibly others) not bundling correctly.

The `package.json` in this folder installs just a locked version of `next` that will be copied into the `app-entry` lambda.