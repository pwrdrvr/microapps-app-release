import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/react/types-6-0';
import InlineEdit from './InlineEdit';

export default {
  title: 'InlineEdit',
  component: InlineEdit,
} as Meta;

const Template: Story = (args) => <InlineEdit {...args} />;

export const Default = Template.bind({});
Default.args = { width: 700, height: 400 };
