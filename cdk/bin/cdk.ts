#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ReposStack } from '../lib/repos';
import { SvcsStack } from '../lib/svcs';
import SharedTags from '../lib/SharedTags';
import SharedProps from '../lib/SharedProps';

const app = new cdk.App();

const shared = new SharedProps(app);

const appName = 'release';

const reposStack = new ReposStack(
  app,
  `microapps-app-${appName}${shared.envSuffix}${shared.prSuffix}-repos`,
  {
    local: { appName },
    shared,
  },
);
new SvcsStack(app, `microapps-app-${appName}${shared.envSuffix}${shared.prSuffix}-svcs`, {
  reposExports: reposStack,
  local: { appName },
  shared,
});
