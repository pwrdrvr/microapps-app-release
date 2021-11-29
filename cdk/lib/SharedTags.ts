import * as cdk from '@aws-cdk/core';
import SharedProps from './SharedProps';
import { Env } from './Types';

export default class SharedTags {
  public static addSharedTags(
    construct: cdk.IConstruct,
    args: { prSuffix: string; appName: string; shared: SharedProps },
  ): void {
    // Add a tag indicating this app can be managed by the
    // MicroApp Deployer Lambda function
    cdk.Tags.of(construct).add('microapp-managed', 'true');
    cdk.Tags.of(construct).add('microapp-name', args.appName);
    cdk.Tags.of(construct).add('repository', 'https://github.com/pwrdrvr/microapps-app-release/');
    cdk.Tags.of(construct).add('application', `microapps-app-${args.appName}`);
  }

  public static addEnvTag(construct: cdk.IConstruct, env: Env | '', isEphemeral: boolean): void {
    if (env !== '' && env !== undefined) cdk.Tags.of(construct).add('environment', env);
    if (isEphemeral) {
      cdk.Tags.of(construct).add('ephemeral', 'true');
      // Note: a dynamic timestamp tag causes all dependency stacks
      // to redeploy to update the timestamp tag, which takes forever with
      // CloudFront.  It may be possible to preserve this in `cdk.context.json`
      // for local deploys, but this won't work well with CI builds of PRs as
      // there is no where to store the updated `cdk.context.json` for that PR.
      // cdk.Tags.of(construct).add('Ephemeral-Created', new Date().toISOString());
    }
  }
}
