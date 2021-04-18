import React from 'react';
import BaseTable, { ColumnShape } from 'react-base-table';
import EditableRuleCell from '../components/EditableRuleCell';

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
    cellRenderer: EditableRuleCell,
  },
];
const data = [
  { DisplayName: 'cat1', AppName: 'catApp1', value: 'dog1' },
  { DisplayName: 'cat2', AppName: 'catApp2', value: 'dog2' },
  { DisplayName: 'cat3', AppName: 'catApp3', value: 'dog3' },
];

const InlineEdit = () => (
  <>
    <BaseTable width={700} height={400} columns={columns} data={data} />
  </>
);

export default InlineEdit;
