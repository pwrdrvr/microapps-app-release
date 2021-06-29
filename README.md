# Overview

This is the Release Console for the microapps framework.

# Adding Storybook to Exiting NPM React / Next Project

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

`AWS_REGION=us-east-2 NODE_ENV=dev ENV=dev CODEBUILD_CDK_CONTEXT_ARGS="--context @pwrdrvr/microapps:tableName=microapps-prod --context @pwrdrvr/microapps:s3BucketName=com.pwrdrvr-microapps-prod" make codebuild-deploy`

### On Dev PR MicroApps Stack

`AWS_REGION=us-east-2 NODE_ENV=dev ENV=dev CODEBUILD_CDK_CONTEXT_ARGS="--context @pwrdrvr/microapps:tableName=microapps-dev-pr-42 --context @pwrdrvr/microapps:s3BucketName=com.pwrdrvr-microapps-dev-pr-42" make codebuild-deploy`

## Deploying - First Time w/CDK Setup

- `aws-vault exec [profile] -- cdk deploy Repos`
  - Creates the ECR repository to receive the app
- `serverless` - Builds the next.js files for deploy (does not deploy)
  - Compiles the next.js code
- `make copy-router`
  - Copies in the API Gateway router code and config
- `aws-vault exec [profile] -- make aws-ecr-login && make aws-ecr-publish-svc`
  - Deploys an image to the ECR repository so a Lambda function referencing it can be created (will fail if not published)
- `aws-vault exec [profile] -- cdk deploy App`
  - Creates the Lambda function, IAM role, assigns permissions, etc.

## Deploying - Subsequent Deploys

- `serverless` - Builds the next.js files for deploy (does not deploy)
  - Compiles the next.js code
- `make copy-router`
  - Copies in the API Gateway router code and config
  - Only necessary if the `.serverless_nextjs` has been deleted
- `aws-vault exec [profile] -- make aws-ecr-login && make aws-ecr-publish-svc`
  - Deploys an image to the ECR repository so a Lambda function referencing it can be created (will fail if not published)
- New version of app code
  - Note: this requires an updated version of HTML to match
  - `aws-vault exec [profile] -- make aws-create-alias-svc`
- Updating existing version of app code
  - `aws-vault exec [profile] -- make aws-update-alias-svc`
- Publishing updated app HTML
  - Not necessary if updating code (not HTML) of existing version
  - `aws-vault exec [staging-publish-profile] -- make microapps-publish`

## Deploying Using versions-update Tool

```
.nvm use
aws-vault exec [profile] -- /bin/bash -l
npx microapps-publish --deployer-lambda-name microapps-deployer-dev-pr-42 --new-version 0.2.4 --repo-name microapps-app-release-dev-repo
```

# Login to GitHub NPM

```
npm login --scope=@pwrdrvr --registry=https://npm.pkg.github.com

# Supply: github username
# GitHub Personal Access Token
# Public NPM Email
```

# Library Notes

## nextjs-redux-wrapper

Version 7.0.0-rc.1 added support for use together with `@reduxjs/toolkit`:

https://github.com/kirill-konshin/next-redux-wrapper/releases/tag/7.0.0-rc.1

Prior to this version the type of store.dispatch was not awaitable - Only the type info was wrong, the actual store.dispatch function was awaitable as described in this issue:

https://github.com/kirill-konshin/next-redux-wrapper/issues/207

Instructions for using Redux-Toolkit with Next-Redux-Wrapper have been added in version 7.0.0:

https://github.com/kirill-konshin/next-redux-wrapper/pull/295/files#diff-b335630551682c19a781afebcf4d07bf978fb1f8ac04c6bf87428ed5106870f5R641
