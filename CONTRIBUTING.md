# Overview

[TBC]

# Developer Notes

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
