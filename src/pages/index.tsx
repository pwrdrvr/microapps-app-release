import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { NextPageContext } from 'next';
import { Grid, AutoSizer } from 'react-virtualized';
import Manager, { Application } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { createLogger } from '../utils/logger';
import React from 'react';
import clsx from 'clsx';

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

    this._cellRenderer = this._cellRenderer.bind(this);
    this._getRowClassName = this._getRowClassName.bind(this);
    this._noContentRenderer = this._noContentRenderer.bind(this);
    this._renderBodyCell = this._renderBodyCell.bind(this);
    this._renderLeftSideCell = this._renderLeftSideCell.bind(this);
  }

  render(): JSX.Element {
    const { columnCount, height, rowHeight, rowCount } = this.state;

    return (
      <div className={styles.container}>
        <Head>
          <title>Release Console</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <h1 className={styles.title}>Release Console</h1>

          <section>
            <h2>Applications</h2>
            <div>
              <AutoSizer disableHeight>
                {({ width }) => (
                  <Grid
                    cellRenderer={this._cellRenderer}
                    className={styles.BodyGrid}
                    columnWidth={this._getColumnWidth}
                    columnCount={columnCount}
                    height={height}
                    noContentRenderer={this._noContentRenderer}
                    overscanColumnCount={0}
                    overscanRowCount={10}
                    rowHeight={rowHeight}
                    rowCount={rowCount}
                    width={width}
                  />
                )}
              </AutoSizer>
            </div>
          </section>
        </main>
      </div>
    );
  }

  _cellRenderer({
    columnIndex,
    key,
    rowIndex,
    style,
  }: {
    columnIndex: number;
    key: string;
    rowIndex: number;
    style: React.CSSProperties;
  }): JSX.Element {
    if (columnIndex === 0) {
      return this._renderLeftSideCell({ key, rowIndex, style });
    } else {
      return this._renderBodyCell({ columnIndex, key, rowIndex, style });
    }
  }

  _getColumnWidth({ index }: { index: number }): number {
    switch (index) {
      case 0:
        return 50;
      case 1:
        return 100;
      case 2:
        return 300;
      default:
        return 80;
    }
  }

  _getDatum(index: number): IApplication {
    const { apps } = this.state;

    return apps[index];
  }

  _getRowClassName(row: number): string {
    return row % 2 === 0 ? styles.evenRow : styles.oddRow;
  }

  _getRowHeight({ index }: { index: number }): number {
    //return this._getDatum(index).size;
    return 40;
  }

  _noContentRenderer(): JSX.Element {
    return <div className={styles.noCells}>No cells</div>;
  }

  _renderBodyCell({
    columnIndex,
    key,
    rowIndex,
    style,
  }: {
    columnIndex: number;
    key: string;
    rowIndex: number;
    style: React.CSSProperties;
  }): JSX.Element {
    const rowClass = this._getRowClassName(rowIndex);
    const datum = this._getDatum(rowIndex);

    let content;

    switch (columnIndex) {
      case 1:
        content = datum.AppName;
        break;
      case 2:
        content = datum.DisplayName;
        break;
      default:
        content = `r:${rowIndex}, c:${columnIndex}`;
        break;
    }

    const classNames = clsx(rowClass, styles.cell, {
      [styles.centeredCell]: columnIndex > 2,
    });

    return (
      <div className={classNames} key={key} style={style}>
        {content}
      </div>
    );
  }

  _renderLeftSideCell({
    key,
    rowIndex,
    style,
  }: {
    key: string;
    rowIndex: number;
    style: React.CSSProperties;
  }): JSX.Element {
    const datum = this._getDatum(rowIndex);

    const classNames = clsx(styles.cell, styles.letterCell);

    // Don't modify styles.
    // These are frozen by React now (as of 16.0.0).
    // Since Grid caches and re-uses them, they aren't safe to modify.
    // style = {
    //   ...style,
    //   backgroundColor: datum.color,
    // };

    return (
      <div className={classNames} key={key} style={style}>
        {datum.AppName.charAt(0)}
      </div>
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
