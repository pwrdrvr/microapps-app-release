import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as s3 from '@aws-cdk/aws-s3';
import { IReposExports } from './repos';

export interface ISvcsProps extends cdk.StackProps {
  reposExports: IReposExports;
  appName: string;
  appStackName: string;
}

export class SvcsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ISvcsProps) {
    super(scope, id, props);

    //
    // Lambda Function
    //
    const svc = new lambda.DockerImageFunction(this, `App${props.appStackName}Lambda`, {
      code: lambda.DockerImageCode.fromEcr(props.reposExports.svc),
      functionName: `app-${props.appName}`,
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        NODE_ENV: 'production',
      },
      memorySize: 1024,
      timeout: cdk.Duration.seconds(15),
    });

    //
    // DynamoDB Table for MicroApps
    //
    const table = dynamodb.Table.fromTableName(this, 'micro-apps-table', 'MicroApps');
    table.grantReadWriteData(svc);
    table.grant(svc, 'dynamodb:DescribeTable');

    //
    // S3 bucket for deployed apps
    // Next.js apps need read/write access to their directory
    //
    const bucket = s3.Bucket.fromBucketName(this, 'pwrdrvr-apps-bucket', 'pwrdrvr-apps');
    bucket.grantReadWrite(svc);
  }
}
