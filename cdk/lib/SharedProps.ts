import * as cdk from '@aws-cdk/core';
import { Env } from './Types';

export default class SharedProps {
  private _env: Env | '' = 'dev';
  public get env(): Env | '' {
    if (this._env === '' || this._env == undefined) return '';
    return this._env;
  }
  public get envSuffix(): string {
    if (this._env === '' || this._env == undefined) return '';
    return `-${this._env}`;
  }
  public get envDomainSuffix(): string {
    if (this._env === '' || this._env == undefined || this._env === 'prod') return '';
    return `-${this._env}`;
  }

  private _pr: string;
  public get pr(): string {
    return this._pr;
  }
  public get prSuffix(): string {
    if (this._pr === undefined) return '';
    return `-pr-${this._pr}`;
  }
  public get isPR(): boolean {
    if (this._pr === undefined) return false;
    return true;
  }

  private _stackName = 'microapps';
  public get stackName(): string {
    return this._stackName;
  }

  private _tableName = 'microapps';
  public get tableName(): string {
    return this._tableName;
  }

  private _s3BucketName = 'microapps';
  public get s3BucketName(): string {
    return this._s3BucketName;
  }

  constructor(scope: cdk.Construct) {
    this._tableName = scope.node.tryGetContext('tableName');
    this._s3BucketName = scope.node.tryGetContext('s3BucketName');

    // Determine if we have a PR number
    const prPrefix = 'pr/';
    const sourceVersion = process.env['CODEBUILD_SOURCE_VERSION'];
    const isPR = sourceVersion?.indexOf(prPrefix) === 0;
    if (isPR) {
      this._pr = sourceVersion?.slice(prPrefix.length) as string;
    }

    // Determine the env from NODE_ENV
    const env = process.env['NODE_ENV'];
    if (env !== undefined && env !== '') {
      if (env.startsWith('prod')) {
        this._env = 'prod';
      } else if (env === 'qa') {
        this._env = 'qa';
      }
    }
  }

  // input like 'example.com.' will return as 'com.example'
  private static reverseDomain(domain: string): string {
    let parts = domain.split('.').reverse();
    if (parts[0] === '') {
      parts = parts.slice(1);
    }
    return parts.join('.');
  }
}
