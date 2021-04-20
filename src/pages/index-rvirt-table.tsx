import '../styles/Home.module.css';
import { NextPageContext } from 'next';
import Manager, { Application } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { createLogger } from '../utils/logger';
import React from 'react';
import AppTable, { IApplication } from '../components/AppTable';
import VersionTable, { IVersion } from '../components/VersionTable';
import RulesTable, { IRules } from '../components/RulesTable';
import { AutoSizer } from 'react-virtualized';

interface IPageProps {
  apps: IApplication[];
  versions: IVersion[];
  rules: IRules;
}

interface IPageState {
  apps: IApplication[];
  versions: IVersion[];
  rules: IRules;
}

export default class Home extends React.PureComponent<IPageProps, IPageState> {
  constructor(props: IPageProps) {
    super(props);

    this.state = {
      apps: this.props.apps,
      versions: this.props.versions,
      rules: this.props.rules,
    };
  }

  render(): JSX.Element {
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <div style={{ flex: '1 0 auto' }}>
          <AutoSizer>
            {({ height, width }) => (
              <AppTable apps={this.props.apps} height={height} width={width}></AppTable>
            )}
          </AutoSizer>
        </div>
        <div style={{ flex: '1 0 auto' }}>
          <AutoSizer>
            {({ height, width }) => (
              <VersionTable vers={this.props.versions} height={height} width={width}></VersionTable>
            )}
          </AutoSizer>
        </div>
        <div style={{ flex: '1 0 auto' }}>
          <AutoSizer>
            {({ height, width }) => (
              <RulesTable rules={this.props.rules} height={height} width={width}></RulesTable>
            )}
          </AutoSizer>
        </div>
      </div>
    );
  }
}

let dbclient: dynamodb.DynamoDB;
let manager: Manager;

// This gets called on every request
export async function getServerSideProps(ctx: NextPageContext): Promise<{ props: IPageProps }> {
  const log = createLogger('pages:index', ctx?.req?.url);

  try {
    if (manager === undefined) {
      dbclient = new dynamodb.DynamoDB({});
      manager = new Manager(dbclient);
    }

    // Get the apps
    const appsRaw = await Application.LoadAllAppsAsync(manager.DBDocClient);
    const apps = [] as IApplication[];
    for (const app of appsRaw) {
      apps.push({ AppName: app.AppName, DisplayName: app.DisplayName });
    }
    log.info(`got apps`, apps);

    // Get the versions
    const versionsRaw = await Manager.GetVersionsAndRules('release');
    const versions = [] as IVersion[];
    for (const version of versionsRaw.Versions) {
      versions.push({
        AppName: version.AppName,
        SemVer: version.SemVer,
        Type: version.Type,
        Status: version.Status,
        //DefaultFile: version.DefaultFile,
        IntegrationID: version.IntegrationID,
      });
    }
    log.info(`got versions`, versions);

    // Get the rules
    const rules = {} as IRules;
    rules.AppName = versionsRaw.Rules.AppName;
    rules.RuleSet = [];
    for (const key of Object.keys(versionsRaw.Rules.RuleSet)) {
      const rule = versionsRaw.Rules.RuleSet[key];
      rules.RuleSet.push({
        key,
        rule: {
          AttributeName: rule.AttributeName ?? '',
          AttributeValue: rule.AttributeValue ?? '',
          SemVer: rule.SemVer,
        },
      });
    }
    log.info(`got rules`, versions);

    // Pass data to the page via props
    return { props: { apps, versions, rules } };
  } catch (error) {
    log.error(`error getting apps: ${error.message}}`);
    log.error(error);
    return {
      props: {
        apps: [{ AppName: 'cat', DisplayName: 'dog' }],
        versions: [
          {
            AppName: 'cat',
            SemVer: '0.0.0',
            DefaultFile: 'index.html',
            Status: 'done?',
            IntegrationID: 'none',
            Type: 'next.js',
          },
        ],
        rules: {
          AppName: 'cat',
          RuleSet: [
            { key: 'default', rule: { SemVer: '0.0.0', AttributeName: '', AttributeValue: '' } },
          ],
        },
      },
    };
  }
}
