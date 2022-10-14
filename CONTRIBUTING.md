# Overview

# Table of Contents <!-- omit in toc -->

- [Overview](#overview)
- [Developer Notes](#developer-notes)
  - [Debugging the Next.js App](#debugging-the-nextjs-app)
  - [nextjs-redux-wrapper](#nextjs-redux-wrapper)
  - [Adding Storybook to Existing NPM React / Next Project](#adding-storybook-to-existing-npm-react--next-project)
- [Errors During `npm run build` Locally](#errors-during-npm-run-build-locally)
# Developer Notes

## Debugging the Next.js App

Either run commands from the `packages/app` directory OR run from the root and use the workspace flag. Examples:

- From Project Root

  - Start App: `npm run -w @pwrdrvr/microapps-app-release dev`
  - Build: `npm run -w @pwrdrvr/microapps-app-release build`
  - Debug: `npm run -w @pwrdrvr/microapps-app-release debug`

- From `packages/app/` Directory

  - Start App: `npm run dev`
  - Build: `npm run build`
  - Debug: `npm run debug`

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

# Errors During `npm run build` Locally

`packages/cdk-construct/tsconfig.json` is missing `"skipLibCheck": true` in the `compilerOptions` section. This causes the errors below.  This is handled during the GitHub Actions workflows by patching in the setting before running `npm run build`.  This is not as simple as passing the `--skipLibCheck` flag to the `tsc` command because `tsc` does not allow that flag when `--build` is passed:

[tsc does not allow flags when --build is passed](https://github.com/microsoft/TypeScript/issues/25613)

```log
node_modules/flatpickr/dist/types/instance.d.ts:37:21 - error TS2304: Cannot find name 'Node'.

37     pluginElements: Node[];
                       ~~~~

node_modules/flatpickr/dist/types/instance.d.ts:82:56 - error TS2304: Cannot find name 'HTMLElementTagNameMap'.

82     _createElement: <E extends HTMLElement>(tag: keyof HTMLElementTagNameMap, className: string, content?: string) => E;
                                                          ~~~~~~~~~~~~~~~~~~~~~

node_modules/flatpickr/dist/types/instance.d.ts:93:16 - error TS2304: Cannot find name 'Node'.

93     (selector: Node, config?: Options): Instance;
                  ~~~~

node_modules/flatpickr/dist/types/instance.d.ts:94:26 - error TS2304: Cannot find name 'Node'.

94     (selector: ArrayLike<Node>, config?: Options): Instance[];
                            ~~~~

node_modules/@types/carbon-components-react/lib/components/FileUploader/FileUploaderDropContainer.d.ts:46:80 - error TS2304: Cannot find name 'File'.

46     onAddFiles?: ((event: React.DragEvent<HTMLElement>, content: { addedFiles: File[] }) => void) | undefined;
                                                                                  ~~~~

node_modules/@types/overlayscrollbars/index.d.ts:348:19 - error TS2304: Cannot find name 'NodeListOf'.

348         elements: NodeListOf<Element> | ReadonlyArray<Element> | JQuery,
                      ~~~~~~~~~~

node_modules/@types/overlayscrollbars/index.d.ts:353:19 - error TS2304: Cannot find name 'NodeListOf'.

353         elements: NodeListOf<Element> | ReadonlyArray<Element> | JQuery,
                      ~~~~~~~~~~


Found 7 errors.
```
