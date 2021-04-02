import React from 'react';
import { Column, Table } from 'react-virtualized';
import { IRule } from '@pwrdrvr/microapps-datalib/dist/models/rules';

interface IFlatRule {
  key: string;
  rule: IRule;
}

export interface IRules {
  AppName: string;
  RuleSet: IFlatRule[];
}

interface IPageProps {
  rules: IRules;
  height: number;
  width: number;
}

interface IPageState {
  rowHeight: number;
  rowCount: number;
  rules: IRules;
}

export default class RulesTable extends React.PureComponent<IPageProps, IPageState> {
  constructor(props: IPageProps) {
    super(props);

    this.state = {
      rowHeight: 40,
      rowCount: this.props.rules.RuleSet.length,
      rules: this.props.rules,
    };
  }

  render(): JSX.Element {
    const { rules } = this.state;

    return (
      <Table
        width={this.props.width}
        height={this.props.height}
        headerHeight={30}
        rowHeight={30}
        rowCount={rules.RuleSet.length}
        rowGetter={({ index }) => rules.RuleSet[index]}
      >
        <Column label="Key" dataKey="key" width={200} />
        <Column width={200} label="Attribute Name" dataKey="rule.AttributeName" />
        <Column
          width={this.props.width - 400}
          label="Attribute Value"
          dataKey="rule.AttributeValue"
        />
      </Table>
    );
  }
}
