# Overview

This is the Release Console for the microapps framework.

# Debugging

- Start app: `npm run debug`
  - If access to AWS resources is needed, `aws-vault exec [profile] -- npm run debug`
- VS Code: Launch `Attach to npm run debug` config
- Breakpoints in .ts files should get hit

Issues: if the breakpoints don't get hit, make sure that `.env.development` has `NODE_ENV=development` and not `NODE_ENV=production` (which causes source maps to not be built).

# Deploying

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
./bin/versions-update.ts --newversion 0.0.8
```
