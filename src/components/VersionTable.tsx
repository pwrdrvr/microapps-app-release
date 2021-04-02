import React from 'react';
import { Column, Table } from 'react-virtualized';

export interface IVersion {
  AppName: string;
  SemVer: string;
  Type: string;
  Status: string;
  DefaultFile?: string;
  IntegrationID: string;
}

interface IPageProps {
  vers: IVersion[];
  height: number;
  width: number;
}

interface IPageState {
  rowHeight: number;
  rowCount: number;
  vers: IVersion[];
}

export default class VersionTable extends React.PureComponent<IPageProps, IPageState> {
  constructor(props: IPageProps) {
    super(props);

    this.state = {
      rowHeight: 40,
      rowCount: this.props.vers.length,
      vers: this.props.vers,
    };
  }

  render(): JSX.Element {
    const { vers } = this.state;

    return (
      <Table
        width={this.props.width}
        height={this.props.height}
        headerHeight={30}
        rowHeight={30}
        rowCount={vers.length}
        rowGetter={({ index }) => vers[index]}
      >
        <Column label="Version" dataKey="SemVer" width={200} />
        <Column width={this.props.width - 200} label="Status" dataKey="Status" />
      </Table>
    );
  }
}
