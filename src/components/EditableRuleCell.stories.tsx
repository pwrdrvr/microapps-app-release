import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/react/types-6-0';
import { ColumnShape } from 'react-base-table';
import EditableRuleCell from './EditableRuleCell';
import SelectableTable, { ISelectableTableProps } from './SelectableTable';

const columns: ColumnShape[] = [
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
    cellRenderer: ({ cellData }) => (
      <EditableRuleCell
        cellData={cellData}
        versions={[
          { AppName: 'cat', Type: '', IntegrationID: '', Status: 'active', SemVer: '0.1.9' },
          { AppName: 'cat', Type: '', IntegrationID: '', Status: 'active', SemVer: '0.1.8' },
          { AppName: 'cat', Type: '', IntegrationID: '', Status: 'active', SemVer: '0.1.7' },
          { AppName: 'cat', Type: '', IntegrationID: '', Status: 'active', SemVer: '0.0.9' },
          { AppName: 'cat', Type: '', IntegrationID: '', Status: 'active', SemVer: '0.0.3' },
        ]}
      />
    ),
  },
];
const data = [
  { DisplayName: 'cat1', AppName: 'catApp1' },
  { DisplayName: 'cat2', AppName: 'catApp2' },
  { DisplayName: 'cat3', AppName: 'catApp3' },
];

export default {
  title: 'EditableRuleCell',
  component: SelectableTable,
} as Meta;

const Template: Story<ISelectableTableProps> = (args) => <SelectableTable {...args} />;

export const Default = Template.bind({});
Default.args = {
  fixed: true,
  width: 700,
  height: 400,
  selectable: true,
  columns: columns,
  data: data,
  rowKey: 'AppName',
};
