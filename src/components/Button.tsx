import * as React from 'react';

type Props = {
  text: string;
};

export default ({ text }: Props): JSX.Element => <button>{text}</button>;
