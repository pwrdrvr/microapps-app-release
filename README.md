![Build/Deploy CI](https://github.com/pwrdrvr/microapps-app-release/actions/workflows/ci.yml/badge.svg) ![Main Build](https://github.com/pwrdrvr/microapps-app-release/actions/workflows/main-build.yml/badge.svg) ![Deploy](https://github.com/pwrdrvr/microapps-app-release/actions/workflows/deploy.yml/badge.svg)

# Overview

This is the Release Console for the microapps framework.

# Adding Storybook to Existing NPM React / Next Project

`npm i -g sb`
`npx sb init -N`
`npx sb upgrade --prerelease -N`

# Debugging

- Start app: `npm run debug`
  - If access to AWS resources is needed, `aws-vault exec [profile] -- npm run debug`
- VS Code: Launch `Attach to npm run debug` config
- Breakpoints in .ts files should get hit

Issues: if the breakpoints don't get hit, make sure that `.env.development` has `NODE_ENV=development` and not `NODE_ENV=production` (which causes source maps to not be built).

# Deploying

## Deploying CDK Stack

### On Default Dev MicroApps Stack

`AWS_REGION=us-east-2 NODE_ENV=dev ENV=dev make codebuild-deploy`

### On QA MicroApps Stack

`AWS_REGION=us-east-2 NODE_ENV=dev ENV=dev CODEBUILD_CDK_CONTEXT_ARGS="--context @pwrdrvr/microapps:tableName=microapps-qa --context @pwrdrvr/microapps:s3BucketName=com.pwrdrvr-microapps-qa" make codebuild-deploy`

### On Prod MicroApps Stack

`AWS_REGION=us-east-2 NODE_ENV=prod ENV=prod CODEBUILD_CDK_CONTEXT_ARGS="--context @pwrdrvr/microapps:tableName=microapps-prod --context @pwrdrvr/microapps:s3BucketName=com.pwrdrvr-microapps-prod" make codebuild-deploy`

### On Dev PR MicroApps Stack

`AWS_REGION=us-east-2 NODE_ENV=dev ENV=dev CODEBUILD_CDK_CONTEXT_ARGS="--context @pwrdrvr/microapps:tableName=microapps-dev-pr-42 --context @pwrdrvr/microapps:s3BucketName=com.pwrdrvr-microapps-dev-pr-42" make codebuild-deploy`

## Deploying Using `microapps-publish` Tool

```
.nvm use
aws-vault exec [profile] -- /bin/bash -l
npx microapps-publish -d microapps-deployer-dev-pr-42 -n 0.2.4 -r microapps-app-release-dev-repo
```

# Library Notes

## nextjs-redux-wrapper

Version 7.0.0-rc.1 added support for use together with `@reduxjs/toolkit`:

https://github.com/kirill-konshin/next-redux-wrapper/releases/tag/7.0.0-rc.1

Prior to this version the type of store.dispatch was not awaitable - Only the type info was wrong, the actual store.dispatch function was awaitable as described in this issue:

https://github.com/kirill-konshin/next-redux-wrapper/issues/207

Instructions for using Redux-Toolkit with Next-Redux-Wrapper have been added in version 7.0.0:

https://github.com/kirill-konshin/next-redux-wrapper/pull/295/files#diff-b335630551682c19a781afebcf4d07bf978fb1f8ac04c6bf87428ed5106870f5R641
