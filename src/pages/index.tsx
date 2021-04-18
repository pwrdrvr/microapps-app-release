import { connect } from 'react-redux';
import React from 'react';
import BaseTable, { AutoResizer, ColumnShape } from 'react-base-table';
import { TableContainer } from 'carbon-components-react';
import { AppDispatch, RootState, wrapper } from '../store/store';
import {
  fetchAppsThunk,
  refreshThunk,
  sortApps,
  SortParams,
  sortVersions,
  success,
} from '../store/main';
import SelectableTable from '../components/SelectableTable';

interface IApplication {
  AppName: string;
  DisplayName: string;
}

interface IVersion {
  AppName: string;
  SemVer: string;
  Type: string;
  Status: string;
  DefaultFile?: string;
  IntegrationID: string;
}

interface IFlatRule {
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

const headersApps: ColumnShape[] = [
  {
    width: 150,
    key: 'AppName',
    dataKey: 'AppName',
    title: 'AppName',
    sortable: true,
  },
  {
    width: 150,
    key: 'DisplayName',
    dataKey: 'DisplayName',
    title: 'Display Name',
    sortable: true,
  },
];
const headersVersions: ColumnShape[] = [
  {
    width: 150,
    key: 'AppName',
    dataKey: 'AppName',
    title: 'AppName',
    sortable: true,
    hidden: true,
  },
  {
    width: 150,
    key: 'SemVer',
    dataKey: 'SemVer',
    title: 'Version',
    sortable: true,
  },
];
const headersRules: ColumnShape[] = [
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

// interface OtherProps {
//   getServerSideProp: string;
//   appProp: string;
// }

//const dispatch = useDispatch<AppDispatch>();

//const Server: NextPage<OtherProps> = ({ appProp, getServerSideProp }: OtherProps) => {
class HomeImpl extends React.PureComponent<IPageProps, RootState> {
  //private someState = useSelector<RootState, RootState>((state) => state);
  //private dispatch = useDispatch<AppDispatch>();

  constructor(props: IPageProps) {
    super(props);

    //const someState = useSelector<RootState, RootState>((state) => state);

    this.render = this.render.bind(this);
    this.refresh = this.refresh.bind(this);
    this.sortApps = this.sortApps.bind(this);
    this.sortVersions = this.sortVersions.bind(this);
    this.selectApp = this.selectApp.bind(this);
  }

  sortApps(args: SortParams) {
    this.props.dispatch(sortApps(args));
  }

  sortVersions(args: SortParams) {
    this.props.dispatch(sortVersions(args));
  }

  async refresh(): Promise<void> {
    await this.props.dispatch(refreshThunk({}));
  }

  async selectApp({
    selected,
    rowData: { AppName },
  }: {
    selected: boolean;
    rowData: {
      AppName: string;
      DisplayName: string;
    };
  }): Promise<void> {
    console.log(`selectApp: ${AppName}`);

    if (selected === false) {
      this.props.dispatch(success({}));
      return;
    }
    await this.props.dispatch(refreshThunk({ appName: AppName }));
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
                <SelectableTable
                  selectable
                  multiSelect={false}
                  width={width}
                  height={height}
                  columns={headersApps}
                  data={this.props.apps}
                  rowKey={'AppName'}
                  sortBy={this.props.appsSortBy}
                  onColumnSort={this.sortApps}
                  onRowSelect={this.selectApp}
                  defaultSelectedRowKeys={['release']}
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
                  <BaseTable
                    width={width}
                    height={height}
                    rowKey={'SemVer'}
                    columns={headersVersions}
                    data={this.props.versions}
                    sortBy={this.props.versionsSortBy}
                    onColumnSort={this.sortVersions}
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
                    rowKey={'key'}
                    data={this.props.rules?.RuleSet}
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
