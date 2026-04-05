import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import SharedProps from './SharedProps';
import { MicroAppsAppRelease } from '@pwrdrvr/microapps-app-release-cdk';
import { Env } from './Types';

export interface ISvcsProps extends StackProps {
  local: {
    appName: string;
  };
  shared: SharedProps;
}

export class SvcsStack extends Stack {
  constructor(scope: Construct, id: string, props: ISvcsProps) {
    super(scope, id, props);

    const { appName } = props.local;
    const { shared } = props;

    const app = new MicroAppsAppRelease(this, 'app', {
      functionName: `microapps-app-${appName}${shared.envSuffix}${shared.prSuffix}`,
      table: dynamodb.Table.fromTableName(this, 'apps-table', shared.tableName),
      nodeEnv: shared.env as Env,
      removalPolicy: shared.isPR ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
    });

    // Export the latest version published
    new CfnOutput(this, 'app-latest-version', {
      value: app.lambdaFunction.latestVersion.version,
      exportName: `microapps-app-version-${appName}${shared.envSuffix}${shared.prSuffix}`,
    });
  }
}
