import { existsSync } from 'fs';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as s3 from '@aws-cdk/aws-s3';
import * as logs from '@aws-cdk/aws-logs';
import * as path from 'path';

export interface MicroAppsAppReleaseProps {
  /**
   * Name for the Lambda function.
   *
   * While this can be random, it's much easier to make it deterministic
   * so it can be computed for passing to `microapps-publish`.
   *
   * @default auto-generated
   */
  functionName?: string;

  /**
   * Bucket with the static assets of the app.
   *
   * Next.js apps need access to the static assets bucket.
   */
  staticAssetsS3Bucket: s3.IBucket;

  /**
   * DynamoDB table for data displayed / edited in the app.
   *
   * This table is used by @pwrdrvr/microapps-datalib.
   */
  table: dynamodb.ITable;

  /**
   * Removal Policy to pass to assets (e.g. Lambda function)
   */
  removalPolicy?: cdk.RemovalPolicy;

  /**
   * `sharp` node module Lambda Layer for Next.js image adjustments
   *
   * @example https://github.com/zoellner/sharp-heic-lambda-layer/pull/3
   */
  sharpLayer?: lambda.ILayerVersion;

  /**
   * NODE_ENV to set on Lambda
   */
  nodeEnv?: 'dev' | 'qa' | 'prod';
}

export interface IMicroAppsAppRelease {
  /**
   * The Lambda function created
   */
  lambdaFunction: lambda.IFunction;
}

export class MicroAppsAppRelease extends cdk.Construct implements IMicroAppsAppRelease {
  private _lambdaFunction: lambda.Function;
  public get lambdaFunction(): lambda.IFunction {
    return this._lambdaFunction;
  }

  /**
   * Lambda function, permissions, and assets used by the MicroApps Release app
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: cdk.Construct, id: string, props: MicroAppsAppReleaseProps) {
    super(scope, id);

    const {
      functionName,
      nodeEnv = 'dev',
      removalPolicy,
      sharpLayer,
      staticAssetsS3Bucket,
      table,
    } = props;

    // Create Lambda Function
    let code: lambda.AssetCode;
    if (existsSync(path.join(__dirname, '.serverless_nextjs', 'index.js'))) {
      // This is for built apps packaged with the CDK construct
      code = lambda.Code.fromAsset(path.join(__dirname, '.serverless_nextjs'));
    } else {
      // This is the path for local / developer builds
      code = lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'app', '.serverless_nextjs'));
    }

    //
    // Lambda Function
    //
    this._lambdaFunction = new lambda.Function(this, 'app-lambda', {
      code,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      functionName,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        NODE_ENV: nodeEnv,
        S3BUCKETNAME: staticAssetsS3Bucket.bucketName,
        DATABASE_TABLE_NAME: table.tableName,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 1769,
      timeout: cdk.Duration.seconds(15),
    });
    if (removalPolicy !== undefined) {
      this._lambdaFunction.applyRemovalPolicy(removalPolicy);
    }
    // Add the Sharp layer if it was provided, else skip it
    if (sharpLayer !== undefined) {
      this._lambdaFunction.addLayers(sharpLayer);
    }

    // Give permission to the table
    table.grantReadWriteData(this._lambdaFunction);
    table.grant(this._lambdaFunction, 'dynamodb:DescribeTable');

    // S3 bucket for deployed apps
    // Next.js apps need read/write access to their directory
    staticAssetsS3Bucket.grantReadWrite(this._lambdaFunction);
  }
}
