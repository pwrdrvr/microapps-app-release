import { Tags } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';
import SharedProps from './SharedProps';
import { Env } from './Types';

export default class SharedTags {
  public static addSharedTags(
    construct: IConstruct,
    args: { prSuffix: string; appName: string; shared: SharedProps },
  ): void {
    // Add a tag indicating this app can be managed by the
    // MicroApp Deployer Lambda function
    Tags.of(construct).add('microapp-managed', 'true');
    Tags.of(construct).add('microapp-name', args.appName);
    Tags.of(construct).add('repository', 'https://github.com/pwrdrvr/microapps-app-release/');
    Tags.of(construct).add('application', `microapps-app-${args.appName}`);
  }

  public static addEnvTag(construct: IConstruct, env: Env | '', isEphemeral: boolean): void {
    if (env !== '' && env !== undefined) Tags.of(construct).add('environment', env);
    if (isEphemeral) {
      Tags.of(construct).add('ephemeral', 'true');
      // Note: a dynamic timestamp tag causes all dependency stacks
      // to redeploy to update the timestamp tag, which takes forever with
      // CloudFront.  It may be possible to preserve this in `context.json`
      // for local deploys, but this won't work well with CI builds of PRs as
      // there is no where to store the updated `context.json` for that PR.
      // Tags.of(construct).add('Ephemeral-Created', new Date().toISOString());
    }
  }
}
