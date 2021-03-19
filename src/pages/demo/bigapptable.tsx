import { NextPageContext } from 'next';
import Manager, { Application } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { createLogger } from '../../utils/logger';
import React from 'react';
import AppTable, { IApplication } from '../../components/AppTable';
import { AutoSizer } from 'react-virtualized';

interface IPageProps {
  apps: IApplication[];
}

export default class BigAppTable extends React.PureComponent<IPageProps> {
  constructor(props: IPageProps) {
    super(props);
  }

  render(): JSX.Element {
    return (
      <AutoSizer>
        {({ height, width }) => (
          <AppTable apps={this.props.apps} height={height} width={width}></AppTable>
        )}
      </AutoSizer>
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
      for (let i = 0; i < 40; i++) {
        apps.push({ AppName: app.AppName + i, DisplayName: app.DisplayName });
      }
    }
    log.info(`got apps`, apps);

    // Pass data to the page via props
    return { props: { apps } };
  } catch (error) {
    log.error(`error getting apps: ${error.message}}`);
    log.error(error);
    return {
      props: {
        apps: [{ AppName: 'cat', DisplayName: 'dog' }],
      },
    };
  }
}
