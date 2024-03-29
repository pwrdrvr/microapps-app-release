// src/stories/Button.stories.tsx

import * as React from 'react';
import { storiesOf } from '@storybook/react';
import Button from './Button';

storiesOf('Button', module).add('with text', () => {
  return <Button text="Click Me" />;
});
