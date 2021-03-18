import styles from '../styles/Home.module.css';
import { NextPageContext } from 'next';
import Manager, { Application } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { createLogger } from '../utils/logger';
import React from 'react';
import AppGrid, { IApplication } from '../components/AppGrid';
import { ContentBox } from '../components/ContentBox';
import VersionGrid, { IVersion } from '../components/VersionGrid';
import RulesGrid, { IRules } from '../components/RulesGrid';

interface IPageProps {
  apps: IApplication[];
  versions: IVersion[];
  rules: IRules;
}

interface IPageState {
  columnCount: number;
  height: number;
  rowHeight: number;
  rowCount: number;
  apps: IApplication[];
  versions: IVersion[];
  rules: IRules;
}

export default class Home extends React.PureComponent<IPageProps, IPageState> {
  constructor(props: IPageProps) {
    super(props);

    this.state = {
      columnCount: 3,
      height: 300,
      rowHeight: 40,
      rowCount: this.props.apps.length,
      apps: this.props.apps,
      versions: this.props.versions,
      rules: this.props.rules,
    };
  }

  render(): JSX.Element {
    return (
      <ContentBox className={styles.ContentBox} style={{ marginRight: 5 + 'em' }}>
        <AppGrid apps={this.props.apps}></AppGrid>
        <VersionGrid vers={this.props.versions}></VersionGrid>
        <RulesGrid rules={this.props.rules}></RulesGrid>
      </ContentBox>
    );
  }
}

let dbclient: dynamodb.DynamoDB;
let manager: Manager;

// This gets called on every request
export async function getServerSideProps(ctx: NextPageContext): Promise<{ props: IPageProps }> {
  const log = createLogger('pages:index', ctx.req.url);

  try {
    if (manager === undefined) {
      dbclient = new dynamodb.DynamoDB({});
      manager = new Manager(dbclient);
    }

    // Get the apps
    const appsRaw = await Application.LoadAllAppsAsync(dbclient);
    const apps = [] as IApplication[];
    for (const app of appsRaw) {
      apps.push({ AppName: app.AppName, DisplayName: app.DisplayName });
    }
    log.info(`got apps`, apps);

    // Get the versions
    const versionsRaw = await manager.GetVersionsAndRules('release');
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
