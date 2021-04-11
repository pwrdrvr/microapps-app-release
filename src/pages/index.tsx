import '../styles/AppGridBaseTable.module.scss';
import { NextPage, NextPageContext } from 'next';
import { useSelector } from 'react-redux';
import Manager, { Application } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { createLogger } from '../utils/logger';
import { RootState } from '../store/store';
import React from 'react';
import BaseTable, { AutoResizer } from 'react-base-table';
import { TableContainer } from 'carbon-components-react';
import { fetchAppsThunk, IPageState } from '../store/main';
import { wrapper } from '../store/store';
import { resourceLimits } from 'node:worker_threads';

const headersApps = [
  {
    width: 150,
    key: 'AppName',
    dataKey: 'AppName',
    title: 'AppName',
  },
  {
    width: 150,
    key: 'DisplayName',
    dataKey: 'DisplayName',
    title: 'Display Name',
  },
];
const headersVersions = [
  {
    width: 150,
    key: 'AppName',
    dataKey: 'AppName',
    title: 'AppName',
    sortable: true,
  },
  {
    width: 150,
    key: 'SemVer',
    dataKey: 'SemVer',
    title: 'Version',
    sortable: true,
  },
];
const headersRules = [
  {
    width: 150,
    key: 'key',
    dataKey: 'key',
    title: 'Key',
  },
  {
    width: 150,
    key: 'SemVer',
    dataKey: 'SemVer',
    title: 'Version',
  },
];

interface OtherProps {
  getServerSideProp: string;
  appProp: string;
}

const Server: NextPage<OtherProps> = ({ appProp, getServerSideProp }) => {
  const { mainPage } = useSelector<RootState, RootState>((state) => state);
  const { apps, versions, rules } = mainPage;
  //   return <div></div>;
  // };

  // export default class Home extends React.PureComponent<IPageProps, IPageState> {
  //   constructor(props: IPageProps) {
  //     super(props);

  //     this.state = {
  //       apps: this.props.apps,
  //       versions: this.props.versions,
  //       rules: this.props.rules,
  //     };

  //     this.render = this.render.bind(this);
  //   }

  //   render(): JSX.Element {
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
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <TableContainer title={'Applications'} />
        <div style={{ flex: '1 0 auto' }}>
          <AutoResizer>
            {({ width, height }) => (
              <BaseTable width={width} height={height} columns={headersApps} data={apps} />
            )}
          </AutoResizer>
        </div>
      </div>
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          <TableContainer title={'Versions'} />
          <div style={{ flex: '1 0 auto' }}>
            <AutoResizer>
              {({ width, height }) => (
                <BaseTable
                  width={width}
                  height={height}
                  columns={headersVersions}
                  data={versions}
                />
              )}
            </AutoResizer>
          </div>
        </div>
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          <TableContainer title={'Rules'} />
          <div style={{ flex: '1 0 auto' }}>
            <AutoResizer>
              {({ width, height }) => (
                <BaseTable
                  width={width}
                  height={height}
                  columns={headersRules}
                  data={rules?.RuleSet}
                />
              )}
            </AutoResizer>
          </div>
        </div>
      </div>
    </div>
  );
};

let dbclient: dynamodb.DynamoDB;
let manager: Manager;

const testPayload: IPageState = {
  apps: [{ id: 'cat', AppName: 'cat', DisplayName: 'dog' }],
  versions: [
    {
      id: 'cat',
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
      {
        id: 'default',
        key: 'default',
        AttributeName: '',
        AttributeValue: '',
        SemVer: '0.0.0',
      },
    ],
  },
};

export const getServerSideProps = wrapper.getServerSideProps(async ({ store }) => {
  const res = store.dispatch(fetchAppsThunk());
  return {
    props: {
      // apps: res.apps,
      // versions: res.versions,
      // rules: res.rules,
      apps: [],
      versions: [],
      rules: { AppName: '', RuleSet: [] },
    },
  };
});

export default Server;
