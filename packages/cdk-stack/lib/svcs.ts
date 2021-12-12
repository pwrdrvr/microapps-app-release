import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as s3 from '@aws-cdk/aws-s3';
import SharedProps from './SharedProps';
import { MicroAppsAppRelease } from '@pwrdrvr/microapps-app-release-cdk';
import { Env } from './Types';

export interface ISvcsProps extends cdk.StackProps {
  local: {
    appName: string;
  };
  shared: SharedProps;
}

export class SvcsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ISvcsProps) {
    super(scope, id, props);

    const { appName } = props.local;
    const { shared } = props;

    // TODO: Allow sharp layer to be omitted
    const sharpLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'sharp-lambda-layer',
      `arn:aws:lambda:${shared.region}:${shared.account}:layer:sharp-heic:1`,
    );

    const app = new MicroAppsAppRelease(this, 'app', {
      functionName: `microapps-app-${appName}${shared.envSuffix}${shared.prSuffix}`,
      staticAssetsS3Bucket: s3.Bucket.fromBucketName(this, 'apps-bucket', shared.s3BucketName),
      table: dynamodb.Table.fromTableName(this, 'apps-table', shared.tableName),
      nodeEnv: shared.env as Env,
      removalPolicy: shared.isPR ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      sharpLayer,
    });

    // Export the latest version published
    new cdk.CfnOutput(this, 'app-latest-version', {
      value: app.lambdaFunction.latestVersion.version,
      exportName: `microapps-app-version-${appName}${shared.envSuffix}${shared.prSuffix}`,
    });
  }
}
