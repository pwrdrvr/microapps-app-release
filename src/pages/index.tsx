import '../styles/AppGridBaseTable.module.scss';
import { NextPage } from 'next';
import { useSelector } from 'react-redux';
import Manager from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import React from 'react';
import BaseTable, { AutoResizer } from 'react-base-table';
import { TableContainer } from 'carbon-components-react';
import { RootState, wrapper } from '../store/store';
import { fetchAppsThunk } from '../store/main';
// import { promisify } from 'util';
// const asyncSleep = promisify(setTimeout);

interface IApplication {
  id: string;
  AppName: string;
  DisplayName: string;
}

interface IVersion {
  id: string;
  AppName: string;
  SemVer: string;
  Type: string;
  Status: string;
  DefaultFile?: string;
  IntegrationID: string;
}

interface IFlatRule {
  id: string;
  key: string;
  AttributeName: string;
  AttributeValue: string;
  SemVer: string;
}

interface IRules {
  AppName: string;
  RuleSet: IFlatRule[];
}

interface IPageProps {
  apps: IApplication[];
  versions: IVersion[];
  rules: IRules;
}

export interface IPageState {
  apps: IApplication[];
  versions: IVersion[];
  rules: IRules;
}

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

const Server: NextPage<OtherProps> = ({ appProp, getServerSideProp }: OtherProps) => {
  const someState = useSelector<RootState, RootState>((state) => state);
  const { mainPage } = someState;
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
              <BaseTable width={width} height={height} columns={headersApps} data={mainPage.apps} />
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
                  data={mainPage.versions}
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
                  data={mainPage.rules.RuleSet}
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

export const getServerSideProps = wrapper.getServerSideProps((store) => async () => {
  await store.dispatch(fetchAppsThunk());
  //await asyncSleep(10000);
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
