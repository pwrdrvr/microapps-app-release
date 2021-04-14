import React from 'react';
import SelectableTable from '../components/SelectableTable';
import BaseTable, { base, ColumnShape } from 'react-base-table';

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
  },
];
const data = [{ DisplayName: 'cat', AppName: 'catApp' }];

const IndexSelectable = () => (
  <SelectableTable
    width={700}
    height={400}
    selectable
    columns={columns}
    data={data}
    // onRowSelect={action('onRowSelect')}
    // onSelectedRowsChange={action('onSelectedRowsChange')}
  />
);
export default IndexSelectable;
