import * as cdk from '@aws-cdk/core';
import * as ecr from '@aws-cdk/aws-ecr';
import SharedProps from './SharedProps';

export interface IReposExports {
  svc: ecr.Repository;
}

interface IReposStackProps extends cdk.StackProps {
  local: {
    appName: string;
  };
  shared: SharedProps;
}

export class ReposStack extends cdk.Stack implements IReposExports {
  private readonly _repotsvc: ecr.Repository;

  constructor(scope: cdk.Construct, id: string, props: IReposStackProps) {
    super(scope, id, props);

    const { appName } = props.local;
    const { shared } = props;

    // The code that defines your stack goes here
    this._repotsvc = new ecr.Repository(this, `app-repo`, {
      repositoryName: `microapps-app-${appName}${shared.envSuffix}${shared.prSuffix}-repo`,
    });
    if (shared.isPR) {
      this._repotsvc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }
  }

  public get svc(): ecr.Repository {
    return this._repotsvc;
  }
}
