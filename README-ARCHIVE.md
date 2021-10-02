# 2021-09-18

Below items were archived because they _should_ no longer apply, but some snippets might be useful later.

## Login to GitHub NPM

```
npm login --scope=@pwrdrvr --registry=https://npm.pkg.github.com

# Supply: github username
# GitHub Personal Access Token
# Public NPM Email
```

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
