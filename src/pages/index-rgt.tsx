import '../styles/AppGridBaseTable.module.scss';
import { connect } from 'react-redux';
import React from 'react';
import GridTable from '@nadavshaar/react-grid-table';
import { AutoResizer } from 'react-base-table';
import { TableContainer } from 'carbon-components-react';
import { AppDispatch, RootState, wrapper } from '../store/store';
import { fetchAppsThunk, refreshThunk, sortApps, SortParams, sortVersions } from '../store/main';

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
  appsSortBy: SortParams;
  versionsSortBy: SortParams;
  dispatch: AppDispatch;
}

export interface IPageState {
  apps: IApplication[];
  versions: IVersion[];
  rules: IRules;
}

const headersApps = [
  {
    id: 1,
    width: 150,
    field: 'AppName',
    label: 'AppName',
    sortable: true,
  },
  {
    id: 2,
    width: 150,
    field: 'DisplayName',
    label: 'Display Name',
    sortable: true,
  },
];
const headersVersions = [
  {
    id: 1,
    width: 150,
    field: 'AppName',
    label: 'AppName',
    sortable: true,
    hidden: true,
  },
  {
    id: 2,
    width: 150,
    field: 'SemVer',
    label: 'Version',
    sortable: true,
  },
];
const headersRules = [
  {
    id: 1,
    width: 150,
    field: 'key',
    label: 'Key',
  },
  {
    id: 2,
    width: 150,
    field: 'SemVer',
    label: 'Version',
  },
];

class HomeImpl extends React.PureComponent<IPageProps, RootState> {
  constructor(props: IPageProps) {
    super(props);
    this.render = this.render.bind(this);
    this.refresh = this.refresh.bind(this);
    this.sortApps = this.sortApps.bind(this);
    this.sortVersions = this.sortVersions.bind(this);
  }

  sortApps(args: SortParams) {
    this.props.dispatch(sortApps(args));
  }

  sortVersions(args: SortParams) {
    this.props.dispatch(sortVersions(args));
  }

  async refresh(): Promise<void> {
    await this.props.dispatch(refreshThunk());
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
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          {/* <button onClick={this.refresh}>Refresh</button> */}
          <TableContainer title={'Applications'} />
          <div style={{ flex: '1 0 auto' }}>
            <AutoResizer>
              {({ width, height }) => (
                <GridTable
                  width={width}
                  height={height}
                  columns={headersApps}
                  rows={this.props.apps}
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
                  <GridTable
                    width={width}
                    height={height}
                    columns={headersVersions}
                    rows={this.props.versions}
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
                  <GridTable
                    width={width}
                    height={height}
                    columns={headersRules}
                    rows={this.props.rules?.RuleSet}
                  />
                )}
              </AutoResizer>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

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

//export default Server;

function mapStateToProps(state: RootState) {
  return {
    apps: state.mainPage.apps,
    versions: state.mainPage.versions,
    rules: state.mainPage.rules,
    appsSortBy: state.mainPage.appsSortBy,
    versionsSortBy: state.mainPage.versionsSortBy,
  };
}

function mapDispatchToProps(dispatch: AppDispatch) {
  return {
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(HomeImpl);
