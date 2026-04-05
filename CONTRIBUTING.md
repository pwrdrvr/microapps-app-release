# Overview

# Table of Contents <!-- omit in toc -->

- [Overview](#overview)
- [Developer Notes](#developer-notes)
  - [Repo Setup](#repo-setup)
  - [Trying out `esbuild` on `server.js`](#trying-out-esbuild-on-serverjs)
  - [Debugging the Next.js App](#debugging-the-nextjs-app)
  - [nextjs-redux-wrapper](#nextjs-redux-wrapper)
  - [Adding Storybook to Existing NPM React / Next Project](#adding-storybook-to-existing-npm-react--next-project)
- [Errors During `pnpm build` Locally](#errors-during-pnpm-build-locally)
# Developer Notes

## Repo Setup

This repo now uses `pnpm` for workspace development.

```sh
corepack enable pnpm
pnpm install
```

## Trying out `esbuild` on `server.js`

```
esbuild server.js --bundle --outfile=smol.js --platform=node --external:next/dist/pages/_error --external:critters --external:next/dist/pages/_app --external:next/dist/pages/_document --minify --target=node22
```

Builds, but fails at runtime with:

```
Cannot read properties of undefined (reading 'publicRuntimeConfig')
```

## Debugging the Next.js App

Either run commands from the `packages/app` directory OR run from the root and use the workspace flag. Examples:

- From Project Root

  - Start App: `pnpm --filter @pwrdrvr/microapps-app-release dev`
  - Build: `pnpm --filter @pwrdrvr/microapps-app-release build`
  - Debug: `pnpm --filter @pwrdrvr/microapps-app-release debug`

- From `packages/app/` Directory

  - Start App: `pnpm dev`
  - Build: `pnpm build`
  - Debug: `pnpm debug`

- Open Local App in Browser

  - http://localhost:3000/release/0.0.0

- VS Code: Launch `Attach to pnpm debug` config
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

# Projen Notes

`packages/cdk-construct/.projenrc.js` is now the source of truth for the construct package metadata and version floor. If the generated package files drift after a dependency change, rerun:

```sh
pnpm --filter @pwrdrvr/microapps-app-release-cdk run projen
```

Historical jsii / TypeScript failures around `skipLibCheck` looked like this:

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
