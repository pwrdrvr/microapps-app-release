import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/react/types-6-0';

import SelectableTable, { ISelectableTableProps } from './SelectableTable';
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

export default {
  title: 'SelectableTable2',
  component: SelectableTable,
} as Meta;

const Template: Story<ISelectableTableProps> = (args) => <SelectableTable {...args} />;

export const Default = Template.bind({});
Default.args = {
  width: 700,
  height: 400,
  selectable: true,
  columns: columns,
  data: data,
};

// export const LoggedOut = Template.bind({});
// LoggedOut.args = {
//   ...HeaderStories.LoggedOut.args,
// };
