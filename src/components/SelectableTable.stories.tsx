import * as React from 'react';
import { storiesOf } from '@storybook/react';
import SelectableTable from './SelectableTable';
import { ColumnShape } from 'react-base-table';

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

storiesOf('SelectableTable', module).add('default', () => {
  return <SelectableTable width={700} height={400} selectable columns={columns} data={data} />;
});
