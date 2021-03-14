import styles from '../styles/Home.module.css';
import { NextPageContext } from 'next';
import Manager, { Application } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { createLogger } from '../utils/logger';
import React from 'react';
import AppGrid from '../components/AppGrid';

interface IApplication {
  AppName: string;
  DisplayName: string;
}

interface IPageProps {
  apps: IApplication[];
}

interface IPageState {
  columnCount: number;
  height: number;
  rowHeight: number;
  rowCount: number;
  apps: IApplication[];
}

export default class Home extends React.PureComponent<IPageProps, IPageState> {
  constructor(props: IPageProps, context: NextPageContext) {
    super(props, context);

    this.state = {
      columnCount: 3,
      height: 300,
      rowHeight: 40,
      rowCount: this.props.apps.length,
      apps: this.props.apps,
    };
  }

  render(): JSX.Element {
    return <AppGrid apps={this.props.apps}></AppGrid>;
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
    const appsRaw = await Application.LoadAllAppsAsync(dbclient);

    const apps = [] as IApplication[];
    for (const app of appsRaw) {
      apps.push({ AppName: app.AppName, DisplayName: app.DisplayName });
    }

    log.info(`got apps`, apps);

    // Pass data to the page via props
    return { props: { apps } };
  } catch (error) {
    log.error(`error getting apps: ${error.message}}`);
    log.error(error);
    return { props: { apps: [{ AppName: 'cat', DisplayName: 'dog' }] } };
  }
}
