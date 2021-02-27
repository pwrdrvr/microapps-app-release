#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ReposStack } from '../lib/repos';
import { SvcsStack } from '../lib/svcs';

const app = new cdk.App();

const appName = 'release';
const appStackName = 'Release';

// Add a tag indicating this app can be managed by the
// MicroApp Deployer Lambda function
cdk.Tags.of(app).add('microapp-managed', 'true');
cdk.Tags.of(app).add('microapp-name', appName);

const reposStack = new ReposStack(app, `App${appStackName}Repos`, {
  appName: appName,
  appStackName: appStackName,
});
new SvcsStack(app, `App${appStackName}Svcs`, {
  reposExports: reposStack,
  appName: appName,
  appStackName: appStackName,
});
