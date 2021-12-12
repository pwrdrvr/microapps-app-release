# Overview

[TBC]

# Developer Notes

## Debugging the Next.js App

Either run commands from the `packages/app` directory OR run from the root and use the workspace flag. Examples:

- From Project Root

  - Start App: `npm run -w @pwrdrvr/microapps-app-release dev`
  - Build: `npm run -w @pwrdrvr/microapps-app-release build`
  - Debug: `npm run -w @pwrdrvr/microapps-app-release debug`
  - Package Serverless: `npx -w @pwrdrvr/microapps-app-release serverless`

- From `packages/app/` Directory

  - Start App: `npm run dev`
  - Build: `npm run build`
  - Debug: `npm run debug`
  - Package Serverless: `npx serverless`

- Open Local App in Browser

  - http://localhost:3000/release/0.0.0

- VS Code: Launch `Attach to npm run debug` config
- Breakpoints in .ts files should get hit

Issues: if the breakpoints don't get hit, make sure that `.env.development` has `NODE_ENV=development` and not `NODE_ENV=production` (which causes source maps to not be built).

## nextjs-redux-wrapper

Version 7.0.0-rc.1 added support for use together with `@reduxjs/toolkit`:

https://github.com/kirill-konshin/next-redux-wrapper/releases/tag/7.0.0-rc.1

Prior to this version the type of store.dispatch was not awaitable - Only the type info was wrong, the actual store.dispatch function was awaitable as described in this issue:

https://github.com/kirill-konshin/next-redux-wrapper/issues/207

Instructions for using Redux-Toolkit with Next-Redux-Wrapper have been added in version 7.0.0:

https://github.com/kirill-konshin/next-redux-wrapper/pull/295/files#diff-b335630551682c19a781afebcf4d07bf978fb1f8ac04c6bf87428ed5106870f5R641

## Adding Storybook to Existing NPM React / Next Project

`npm i -g sb`
`npx sb init -N`
`npx sb upgrade --prerelease -N`
