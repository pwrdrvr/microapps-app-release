import * as React from 'react';

type Props = {
  text: string;
};

export default function Button({ text }: Props): JSX.Element {
  return <button>{text}</button>;
}
