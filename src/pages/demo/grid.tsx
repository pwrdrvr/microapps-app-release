import Immutable from 'immutable';
import * as React from 'react';
import { ContentBox, ContentBoxHeader, ContentBoxParagraph } from '../../components/ContentBox';
import { LabeledInput, InputRow } from '../../components/LabeledInput';
import { Grid, AutoSizer } from 'react-virtualized';
import clsx from 'clsx';
import styles from '../../styles/Grid.module.css';
import { generateRandomList, IRandomListElement } from '../../utils/randomList';
import { NextPageContext } from 'next';

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
      height,
      overscanColumnCount,
      overscanRowCount,
      rowHeight,
      rowCount,
      scrollToColumn,
      scrollToRow,
      useDynamicRowHeight,
    } = this.state;

    return (
      <ContentBox className={styles.ContentBox} style={{ marginRight: 5 + 'em' }}>
        <ContentBoxHeader
          text="Grid"
          sourceLink="https://github.com/bvaughn/react-virtualized/blob/master/source/Grid/Grid.example.js"
          docsLink="https://github.com/bvaughn/react-virtualized/blob/master/docs/Grid.md"
        />

        <ContentBoxParagraph>
          Renders tabular data with virtualization along the vertical and horizontal axes. Row
          heights and column widths must be calculated ahead of time and specified as a fixed size
          or returned by a getter function.
        </ContentBoxParagraph>

        <ContentBoxParagraph>
          <label className={styles.checkboxLabel}>
            <input
              aria-label="Use dynamic row height?"
              className={styles.checkbox}
              type="checkbox"
              value={useDynamicRowHeight ? 'true' : 'false'}
              onChange={(event) => this._updateUseDynamicRowHeights(event.target.checked)}
            />
            Use dynamic row height?
          </label>
        </ContentBoxParagraph>

        <InputRow>
          <LabeledInput
            label="Num columns"
            name="columnCount"
            onChange={this._onColumnCountChange}
            value={columnCount.toString()}
          />
          <LabeledInput
            label="Num rows"
            name="rowCount"
            onChange={this._onRowCountChange}
            value={rowCount.toString()}
          />
          <LabeledInput
            label="Scroll to column"
            name="onScrollToColumn"
            placeholder="Index..."
            onChange={this._onScrollToColumnChange}
            value={scrollToColumn?.toString() || ''}
          />
          <LabeledInput
            label="Scroll to row"
            name="onScrollToRow"
            placeholder="Index..."
            onChange={this._onScrollToRowChange}
            value={scrollToRow?.toString() || ''}
          />
          <LabeledInput
            label="List height"
            name="height"
            onChange={(event) => this.setState({ height: parseInt(event.target.value, 10) || 1 })}
            value={height?.toString()}
          />
          <LabeledInput
            disabled={useDynamicRowHeight}
            label="Row height"
            name="rowHeight"
            onChange={(event) =>
              this.setState({
                rowHeight: parseInt(event.target.value, 10) || 1,
              })
            }
            value={rowHeight?.toString()}
          />
          <LabeledInput
            label="Overscan columns"
            name="overscanColumnCount"
            onChange={(event) =>
              this.setState({
                overscanColumnCount: parseInt(event.target.value, 10) || 0,
              })
            }
            value={overscanColumnCount?.toString()}
          />
          <LabeledInput
            label="Overscan rows"
            name="overscanRowCount"
            onChange={(event) =>
              this.setState({
                overscanRowCount: parseInt(event.target.value, 10) || 0,
              })
            }
            value={overscanRowCount?.toString()}
          />
        </InputRow>

        <AutoSizer disableHeight>
          {({ width }) => (
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
      </ContentBox>
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

    return list.get(index % list.size);
  }

  _getRowClassName(row: number): string {
    return row % 2 === 0 ? styles.evenRow : styles.oddRow;
  }

  _getRowHeight({ index }: { index: number }): number {
    return this._getDatum(index).size;
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
