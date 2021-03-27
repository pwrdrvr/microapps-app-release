import { NextPageContext } from 'next';
import Manager, { Application } from '@pwrdrvr/microapps-datalib';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import { createLogger } from '../utils/logger';
import React from 'react';
import {
  Button,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableSelectAll,
  TableHeader,
  TableBody,
  TableSelectRow,
  TableCell,
  Grid,
  Row,
  Column,
} from 'carbon-components-react';
import { IRule } from '@pwrdrvr/microapps-datalib/dist/models/rules';
import { AutoSizer } from 'react-virtualized';

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

interface IPageState {
  apps: IApplication[];
  versions: IVersion[];
  rules: IRules;
}

const rows = [
  {
    id: 'a',
    name: 'Load balancer 1',
    status: 'Disabled',
  },
  {
    id: 'b',
    name: 'Load balancer 2',
    status: 'Starting',
  },
  {
    id: 'c',
    name: 'Load balancer 3',
    status: 'Active',
  },
];
const headersApps = [
  {
    key: 'AppName',
    header: 'AppName',
  },
  {
    key: 'DisplayName',
    header: 'Display Name',
  },
];
const headersVersions = [
  {
    key: 'AppName',
    header: 'AppName',
  },
  {
    key: 'SemVer',
    header: 'Version',
  },
];
const headersRules = [
  {
    key: 'key',
    header: 'Key',
  },
  {
    key: 'SemVer',
    header: 'Version',
  },
];

export default class Home extends React.PureComponent<IPageProps, IPageState> {
  constructor(props: IPageProps) {
    super(props);

    this.state = {
      apps: this.props.apps,
      versions: this.props.versions,
      rules: this.props.rules,
    };

    this.render = this.render.bind(this);
  }

  render(): JSX.Element {
    return (
      <Grid
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <Row style={{ flex: '1 0 auto', overflow: 'scroll' }}>
          <Column sm={4}>
            <DataTable rows={this.props.apps} headers={headersApps}>
              {({ rows, getTableProps, getHeaderProps, getRowProps }) => (
                <TableContainer title={'Applications'}>
                  <Table style={{ height: '100px' }} {...getTableProps()}>
                    <TableHead>
                      <TableRow>
                        {headersApps.map((header) => (
                          <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow {...getRowProps({ row })}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
          </Column>
        </Row>

        <Row style={{ flex: '1 0 auto', overflow: 'scroll' }}>
          <Column sm={4}>
            <DataTable rows={this.props.versions} headers={headersVersions}>
              {({ rows, getTableProps, getHeaderProps, getRowProps }) => (
                <TableContainer title={'Versions'}>
                  <Table style={{ height: '100px' }} {...getTableProps()}>
                    <TableHead>
                      <TableRow>
                        {headersApps.map((header) => (
                          <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow {...getRowProps({ row })}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
          </Column>
        </Row>

        <Row style={{ flex: '1 0 auto', overflow: 'scroll' }}>
          <Column sm={4}>
            <DataTable rows={this.props.rules.RuleSet} headers={headersRules}>
              {({ rows, getTableProps, getHeaderProps, getRowProps }) => (
                <TableContainer title={'Rules'}>
                  <Table style={{ height: '100px' }} {...getTableProps()}>
                    <TableHead>
                      <TableRow>
                        {headersApps.map((header) => (
                          <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow {...getRowProps({ row })}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DataTable>
          </Column>
        </Row>
      </Grid>
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
    const appsRaw = await Application.LoadAllAppsAsync(dbclient);
    const apps = [] as IApplication[];
    for (const app of appsRaw) {
      apps.push({ id: app.AppName, AppName: app.AppName, DisplayName: app.DisplayName });
    }
    log.info(`got apps`, apps);

    // Get the versions
    const versionsRaw = await manager.GetVersionsAndRules('release');
    const versions = [] as IVersion[];
    for (const version of versionsRaw.Versions) {
      versions.push({
        id: version.SemVer,
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
        id: key,
        key,
        AttributeName: rule.AttributeName ?? '',
        AttributeValue: rule.AttributeValue ?? '',
        SemVer: rule.SemVer,
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
              rule: { SemVer: '0.0.0', AttributeName: '', AttributeValue: '' },
            },
          ],
        },
      },
    };
  }
}
