import React from 'react';
import { Column, Table } from 'react-virtualized';
import 'react-virtualized/styles.css'; // only needs to be imported once

export interface IApplication {
  AppName: string;
  DisplayName: string;
}

interface IPageProps {
  apps: IApplication[];
  height: number;
  width: number;
}

interface IPageState {
  rowHeight: number;
  rowCount: number;
  apps: IApplication[];
}

export default class AppTable extends React.PureComponent<IPageProps, IPageState> {
  constructor(props: IPageProps) {
    super(props);

    this.state = {
      rowHeight: 40,
      rowCount: this.props.apps.length,
      apps: this.props.apps,
    };
  }

  render(): JSX.Element {
    const { apps } = this.state;

    return (
      <Table
        width={this.props.width}
        height={this.props.height}
        headerHeight={30}
        rowHeight={30}
        rowCount={apps.length}
        rowGetter={({ index }) => apps[index]}
      >
        <Column label="App Name" dataKey="AppName" width={200} />
        <Column width={this.props.width - 200} label="Display Name" dataKey="DisplayName" />
      </Table>
    );
  }
}
