![Build/Deploy CI](https://github.com/pwrdrvr/microapps-app-release/actions/workflows/ci.yml/badge.svg) ![Main Build](https://github.com/pwrdrvr/microapps-app-release/actions/workflows/jsii.yml/badge.svg) ![Deploy](https://github.com/pwrdrvr/microapps-app-release/actions/workflows/deploy.yml/badge.svg) ![Release](https://github.com/pwrdrvr/microapps-app-release/actions/workflows/release.yml/badge.svg)

# Overview

Example / basic Next.js-based Release app for the [MicroApps framework](https://github.com/pwrdrvr/microapps-core).

# Table of Contents <!-- omit in toc -->

- [Overview](#overview)
- [Screenshot](#screenshot)
- [Try the App](#try-the-app)
- [Video Preview of the App](#video-preview-of-the-app)
- [Functionality](#functionality)
- [Installation](#installation)
  - [Installation of CDK Construct](#installation-of-cdk-construct)
    - [Node.js TypeScript/JavaScript](#nodejs-typescriptjavascript)
  - [Sharp Image Processing Lambda Layer](#sharp-image-processing-lambda-layer)
  - [Add the Construct to your CDK Stack](#add-the-construct-to-your-cdk-stack)

# Screenshot

![Main View Screenshot of App](https://raw.githubusercontent.com/pwrdrvr/microapps-app-release/main/assets/images/app-main.png)

# Try the App

[Launch the App](https://dukw9jtyq2dwo.cloudfront.net/prefix/release/)

# Video Preview of the App

![Video Preview of App](https://raw.githubusercontent.com/pwrdrvr/microapps-app-release/main/assets/videos/app-overview.gif)

# Functionality

- Lists all deployed applications
- Shows all versions and rules per application
- Allows setting the `default` rule (pointer to version) for each application

# Installation

Example CDK Stack that deploys `@pwrdrvr/microapps-app-release`:
- [Deploying the MicroAppsAppRelease CDK Construct on the MicroApps CDK Construct](https://github.com/pwrdrvr/microapps-core/blob/main/packages/cdk/lib/MicroApps.ts#L260-L267)

The application is intended to be deployed upon the [MicroApps framework](https://github.com/pwrdrvr/microapps-core) and it operates on a DynamoDB Table created by the MicroApps framework. Thus, it is required that there be a deployment of MicroApps that can receive this application. Deploying the MicroApps framework and general application deployment instructions are covered by the MicroApps documentation.

The application is packaged for deployment via AWS CDK and consists of a single Lambda function that reads/writes the MicroApps DynamoDB Table.

The CDK Construct is available for TypeScript, DotNet, Java, and Python with docs and install instructions available on [@pwrdrvr/microapps-app-release-cdk - Construct Hub](https://constructs.dev/packages/@pwrdrvr/microapps-app-release-cdk).

## Installation of CDK Construct

### Node.js TypeScript/JavaScript

```sh
npm i --save-dev @pwrdrvr/microapps-app-release-cdk
```

## Sharp Image Processing Lambda Layer

The Sharp layer is extracted and shared across all Serverless Next.js apps. The Sharp layer can be built with whatever features you are licensed for (or just open source features) following the example in this PR:

https://github.com/zoellner/sharp-heic-lambda-layer/pull/3

## Add the Construct to your CDK Stack

See [cdk-stack](packages/cdk-stack/lib/svcs.ts) for a complete example used to deploy this app for PR builds.

```typescript
import { MicroAppsAppRelease } from '@pwrdrvr/microapps-app-release-cdk';

const app = new MicroAppsAppRelease(this, 'app', {
  functionName: `microapps-app-${appName}${shared.envSuffix}${shared.prSuffix}`,
  staticAssetsS3Bucket: s3.Bucket.fromBucketName(this, 'apps-bucket', shared.s3BucketName),
  table: dynamodb.Table.fromTableName(this, 'apps-table', shared.tableName),
  nodeEnv: shared.env as Env,
  removalPolicy: shared.isPR ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
  sharpLayer,
});
```
