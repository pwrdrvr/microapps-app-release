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
    cdk.Tags.of(construct).add('Repository', 'https://github.com/pwrdrvr/microapps-app-release/');
    cdk.Tags.of(construct).add('Application', `microapps-app-${args.appName}`);
  }

  public static addEnvTag(construct: cdk.IConstruct, env: Env | '', isEphemeral: boolean): void {
    if (env !== '' && env !== undefined) cdk.Tags.of(construct).add('Environment', env);
    if (isEphemeral) {
      cdk.Tags.of(construct).add('Ephemeral', 'true');
      cdk.Tags.of(construct).add('Ephemeral-Created', new Date().toISOString());
    }
  }
}
