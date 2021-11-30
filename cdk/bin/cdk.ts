#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SvcsStack } from '../lib/svcs';
import SharedTags from '../lib/SharedTags';
import SharedProps from '../lib/SharedProps';

const app = new cdk.App();

const shared = new SharedProps(app);

const appName = 'release';

SharedTags.addSharedTags(app, { shared, appName, prSuffix: shared.prSuffix });

new SvcsStack(app, 'app', {
  stackName: `microapps-app-${appName}${shared.envSuffix}${shared.prSuffix}`,
  local: { appName },
  shared,
});
