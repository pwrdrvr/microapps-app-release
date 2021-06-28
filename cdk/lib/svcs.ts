import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as s3 from '@aws-cdk/aws-s3';
import * as logs from '@aws-cdk/aws-logs';
import { IReposExports } from './repos';
import SharedProps from './SharedProps';

export interface ISvcsProps extends cdk.StackProps {
  reposExports: IReposExports;
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

    //
    // Lambda Function
    //
    const svc = new lambda.DockerImageFunction(this, 'app-lambda', {
      code: lambda.DockerImageCode.fromEcr(props.reposExports.svc),
      functionName: `microapps-app-${appName}${shared.envSuffix}${shared.prSuffix}`,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        NODE_ENV: shared.env,
        S3BUCKETNAME: shared.s3BucketName,
        DATABASE_TABLE_NAME: shared.tableName,
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(15),
    });
    if (shared.isPR) {
      svc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    //
    // DynamoDB Table for MicroApps
    //
    const table = dynamodb.Table.fromTableName(this, 'apps-table', shared.tableName);
    table.grantReadWriteData(svc);
    table.grant(svc, 'dynamodb:DescribeTable');

    //
    // S3 bucket for deployed apps
    // Next.js apps need read/write access to their directory
    //
    const bucket = s3.Bucket.fromBucketName(this, 'apps-bucket', shared.s3BucketName);
    bucket.grantReadWrite(svc);
  }
}
