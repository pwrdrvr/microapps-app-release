import Immutable from 'immutable';
import * as React from 'react';
import { Grid, AutoSizer } from 'react-virtualized';
import clsx from 'clsx';
import styles from '../../styles/Grid.module.css';
import { generateRandomList, IRandomListElement } from '../../utils/randomList';

const staticList = Immutable.List(generateRandomList());

export default class GridExample extends React.PureComponent {
  static contextTypes = {
    list: Immutable.List,
  };
  public state: {
    columnCount: number;
    height: number;
    overscanColumnCount: number;
    overscanRowCount: number;
    rowHeight: number;
    rowCount: number;
    scrollToColumn?: number;
    scrollToRow?: number;
    useDynamicRowHeight: boolean;
  };

  constructor(props: never, context: never) {
    super(props, context);

    this.context.list = staticList;

    this.state = {
      columnCount: 1000,
      height: 300,
      overscanColumnCount: 0,
      overscanRowCount: 10,
      rowHeight: 40,
      rowCount: 1000,
      scrollToColumn: undefined,
      scrollToRow: undefined,
      useDynamicRowHeight: false,
    };

    this._cellRenderer = this._cellRenderer.bind(this);
    this._getColumnWidth = this._getColumnWidth.bind(this);
    this._getRowClassName = this._getRowClassName.bind(this);
    this._getRowHeight = this._getRowHeight.bind(this);
    this._noContentRenderer = this._noContentRenderer.bind(this);
    this._onColumnCountChange = this._onColumnCountChange.bind(this);
    this._onRowCountChange = this._onRowCountChange.bind(this);
    this._onScrollToColumnChange = this._onScrollToColumnChange.bind(this);
    this._onScrollToRowChange = this._onScrollToRowChange.bind(this);
    this._renderBodyCell = this._renderBodyCell.bind(this);
    this._renderLeftSideCell = this._renderLeftSideCell.bind(this);
  }

  render(): JSX.Element {
    const {
      columnCount,
      overscanColumnCount,
      overscanRowCount,
      rowHeight,
      rowCount,
      scrollToColumn,
      scrollToRow,
      useDynamicRowHeight,
    } = this.state;

    return (
      <AutoSizer>
        {({ height, width }) => (
          <Grid
            cellRenderer={this._cellRenderer}
            className={styles.BodyGrid}
            columnWidth={this._getColumnWidth}
            columnCount={columnCount}
            height={height}
            noContentRenderer={this._noContentRenderer}
            overscanColumnCount={overscanColumnCount}
            overscanRowCount={overscanRowCount}
            rowHeight={useDynamicRowHeight ? this._getRowHeight : rowHeight}
            rowCount={rowCount}
            scrollToColumn={scrollToColumn}
            scrollToRow={scrollToRow}
            width={width}
          />
        )}
      </AutoSizer>
    );
  }

  _cellRenderer({
    columnIndex,
    key,
    rowIndex,
    style,
  }: {
    columnIndex: number;
    key: React.Key;
    rowIndex: number;
    style: React.CSSProperties | undefined;
  }): JSX.Element {
    if (columnIndex === 0) {
      return this._renderLeftSideCell({ key, rowIndex, style });
    } else {
      return this._renderBodyCell({ columnIndex, key, rowIndex, style });
    }
  }

  _getColumnWidth({ index }: { index: number }): number {
    switch (index) {
      case 0:
        return 50;
      case 1:
        return 100;
      case 2:
        return 300;
      default:
        return 80;
    }
  }

  _getDatum(index: number): IRandomListElement {
    const { list } = this.context;

    return list.get(index % list.size) as IRandomListElement;
  }

  _getRowClassName(row: number): string {
    return row % 2 === 0 ? styles.evenRow : styles.oddRow;
  }

  _getRowHeight({ index }: { index: number }): number {
    return this._getDatum(index)?.size || 10;
  }

  _noContentRenderer(): JSX.Element {
    return <div className={styles.noCells}>No cells</div>;
  }

  _renderBodyCell({
    columnIndex,
    key,
    rowIndex,
    style,
  }: {
    columnIndex: number;
    key: React.Key;
    rowIndex: number;
    style: React.CSSProperties | undefined;
  }): JSX.Element {
    const rowClass = this._getRowClassName(rowIndex);
    const datum = this._getDatum(rowIndex);

    let content;

    switch (columnIndex) {
      case 1:
        content = datum.name;
        break;
      case 2:
        content = datum.random;
        break;
      default:
        content = `r:${rowIndex}, c:${columnIndex}`;
        break;
    }

    const classNames = clsx(rowClass, styles.cell, {
      [styles.centeredCell]: columnIndex > 2,
    });

    return (
      <div className={classNames} key={key} style={style}>
        {content}
      </div>
    );
  }

  _renderLeftSideCell({
    key,
    rowIndex,
    style,
  }: {
    key: React.Key;
    rowIndex: number;
    style: React.CSSProperties | undefined;
  }): JSX.Element {
    const datum = this._getDatum(rowIndex);

    const classNames = clsx(styles.cell, styles.letterCell);

    // Don't modify styles.
    // These are frozen by React now (as of 16.0.0).
    // Since Grid caches and re-uses them, they aren't safe to modify.
    style = {
      ...style,
      backgroundColor: datum.color,
    };

    return (
      <div className={classNames} key={key} style={style}>
        {datum.name.charAt(0)}
      </div>
    );
  }

  _updateUseDynamicRowHeights(value: boolean): void {
    this.setState({
      useDynamicRowHeight: value,
    });
  }

  _onColumnCountChange(event: { target: { value: string } }): void {
    const columnCount = parseInt(event.target.value, 10) || 0;

    this.setState({ columnCount });
  }

  _onRowCountChange(event: { target: { value: string } }): void {
    const rowCount = parseInt(event.target.value, 10) || 0;

    this.setState({ rowCount });
  }

  _onScrollToColumnChange(event: { target: { value: string } }): void {
    const { columnCount } = this.state;
    let scrollToColumn: number | undefined = Math.min(
      columnCount - 1,
      parseInt(event.target.value, 10),
    );

    if (isNaN(scrollToColumn)) {
      scrollToColumn = undefined;
    }

    this.setState({ scrollToColumn });
  }

  _onScrollToRowChange(event: { target: { value: string } }): void {
    const { rowCount } = this.state;
    let scrollToRow: number | undefined = Math.min(rowCount - 1, parseInt(event.target.value, 10));

    if (isNaN(scrollToRow)) {
      scrollToRow = undefined;
    }

    this.setState({ scrollToRow });
  }
}
