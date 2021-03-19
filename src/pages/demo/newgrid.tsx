import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import styles from '../../styles/NewGrid.module.css';

const Row = ({ index, style }) => (
  <div className={index % 2 ? styles.ListItemOdd : styles.ListItemEven} style={style}>
    Row {index}
  </div>
);

const Example = () => (
  <AutoSizer>
    {({ height, width }) => (
      <div style={{ flexDirection: 'column' }}>
        <List className={styles.List} height={35} itemCount={1} itemSize={35} width={width}>
          {Row}
        </List>
        <List
          className={styles.List}
          height={height - 25}
          itemCount={1000}
          itemSize={35}
          width={width}
        >
          {Row}
        </List>
      </div>
    )}
  </AutoSizer>
);

export default class NewGridExample extends React.PureComponent {
  render(): JSX.Element {
    return <Example />;
  }
}
