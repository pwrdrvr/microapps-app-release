import React from 'react';
import BaseTable, {
  normalizeColumns,
  Column,
  BaseTableProps,
  callOrReturn,
  ColumnShape,
} from 'react-base-table';
import styled from 'styled-components';
import { noop } from '../utils/noop';

//
// cloneArray is defined in react-grid-table and is exported but not at the top-level
// https://github.com/Autodesk/react-base-table/blob/8e657a4dbf424cf3c3cdac2287f26c5723021372/src/utils.js#L123-L129
//
// Babel7 changed the behavior of @babel/plugin-transform-spread in https://github.com/babel/babel/pull/6763
// [...array] is transpiled to array.concat() while it was [].concat(array) before
// this change breaks immutable array(seamless-immutable), [...array] should always return mutable array
export function cloneArray<T>(array: T[]): T[] {
  if (!Array.isArray(array)) return [];
  return ([] as T[]).concat(array);
}

const StyledTable = styled(BaseTable)`
  .row-selected {
  }
`;

// CallOrReturn<React.ReactNode, {
//   cellData: any;
//   columns: ColumnShape<unknown>[];
//   column: ColumnShape<unknown>;
//   columnIndex: number;
//   rowData: unknown;
//   rowIndex: number;
//   container: BaseTable<unknown>;
//   isScrolling?: boolean | undefined;
// }>

interface ICellRendererProps {
  cellData: never;
  columns: ColumnShape<unknown>[];
  column: ColumnShape<unknown>;
  columnIndex: number;
  rowData: never[];
  rowIndex: number;
  container: BaseTable<unknown>;
  isScrolling?: boolean | undefined;
}

class SelectionCell extends React.PureComponent<ICellRendererProps> {
  _handleChange = (e: { target: { checked: boolean } }) => {
    const { rowData, rowIndex, column } = this.props;
    const { onChange } = column;

    onChange({ selected: e.target.checked, rowData, rowIndex });
  };

  render(): JSX.Element {
    const { rowData, column } = this.props;
    const { selectedRowKeys, rowKey } = column;
    const checked = selectedRowKeys.includes(rowData[rowKey]);

    return <input type="checkbox" checked={checked} onChange={this._handleChange} />;
  }
}

export interface ISelectableTableProps extends BaseTableProps {
  selectedRowKeys?: React.Key[];
  defaultSelectedRowKeys?: React.Key[];
  expandedRowKeys?: React.Key[];
  defaultExpandedRowKeys?: React.Key[];
  rowClassName?: string;
  multiSelect?: boolean;
  rowKey?: React.Key;
  onRowSelect?: (args: { selected: boolean; rowData: never; rowIndex: number }) => void;
  onSelectedRowsChange?: (keys: React.Key[]) => void;
}

interface ISelectableTableState {
  selectedRowKeys: React.Key[];
  expandedRowKeys: React.Key[];
}

export default class SelectableTable extends React.PureComponent<
  ISelectableTableProps,
  ISelectableTableState
> {
  constructor(props: ISelectableTableProps) {
    super(props);

    const { selectedRowKeys, defaultSelectedRowKeys, expandedRowKeys, defaultExpandedRowKeys } =
      props;
    this.state = {
      selectedRowKeys:
        (selectedRowKeys !== undefined ? selectedRowKeys : defaultSelectedRowKeys) || [],
      expandedRowKeys:
        (expandedRowKeys !== undefined ? expandedRowKeys : defaultExpandedRowKeys) || [],
    };
  }

  /**
   * Set `selectedRowKeys` manually.
   * This method is available only if `selectedRowKeys` is uncontrolled.
   *
   * @param {array} selectedRowKeys
   */
  setSelectedRowKeys(selectedRowKeys: React.Key[]): void {
    // if `selectedRowKeys` is controlled
    if (this.props.selectedRowKeys !== undefined) return;

    this.setState({
      selectedRowKeys: cloneArray(selectedRowKeys),
    });
  }

  /**
   * See BaseTable#setExpandedRowKeys
   */
  setExpandedRowKeys(expandedRowKeys: React.Key[]): void {
    // if `expandedRowKeys` is controlled
    if (this.props.expandedRowKeys !== undefined) return;

    this.setState({
      expandedRowKeys: cloneArray(expandedRowKeys),
    });
  }

  /* some other custom methods and proxy methods */

  /**
   * Remove rowKeys from inner state  manually, it's useful to purge dirty state after rows removed.
   * This method is available only if `selectedRowKeys` or `expandedRowKeys` is uncontrolled.
   *
   * @param {array} rowKeys
   */
  removeRowKeysFromState(rowKeys: React.Key[]): void {
    if (!Array.isArray(rowKeys)) return;

    const state = {} as ISelectableTableState;
    if (this.props.selectedRowKeys === undefined && this.state.selectedRowKeys.length > 0) {
      state.selectedRowKeys = this.state.selectedRowKeys.filter((key) => !rowKeys.includes(key));
    }
    if (this.props.expandedRowKeys === undefined && this.state.expandedRowKeys.length > 0) {
      state.expandedRowKeys = this.state.expandedRowKeys.filter((key) => !rowKeys.includes(key));
    }
    if (state.selectedRowKeys || state.expandedRowKeys) {
      this.setState(state);
    }
  }

  _handleSelectChange = ({
    selected,
    rowData,
    rowIndex,
  }: {
    selected: boolean;
    rowData: never;
    rowIndex: number;
  }): void => {
    const selectedRowKeys = [...this.state.selectedRowKeys];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const key = rowData[this.props.rowKey!];

    if (selected) {
      // Remove all the elements from the array if we don't support multiSelect
      if (!this.props.multiSelect && selectedRowKeys.length > 0 && !selectedRowKeys.includes(key))
        selectedRowKeys.splice(0);
      if (!selectedRowKeys.includes(key)) selectedRowKeys.push(key);
    } else {
      const index = selectedRowKeys.indexOf(key);
      if (index > -1) {
        selectedRowKeys.splice(index, 1);
      }
    }

    // if `selectedRowKeys` is uncontrolled, update internal state
    if (this.props.selectedRowKeys === undefined) {
      this.setState({ selectedRowKeys });
    }
    if (this.props.onRowSelect !== undefined) {
      this.props.onRowSelect({ selected, rowData, rowIndex });
    }
    if (this.props.onSelectedRowsChange !== undefined) {
      this.props.onSelectedRowsChange(selectedRowKeys);
    }
  };

  _rowClassName = ({
    rowData,
    rowIndex,
  }: {
    rowData: never;
    rowIndex: number;
  }): (string | false)[] => {
    const { rowClassName, rowKey } = this.props;
    const { selectedRowKeys } = this.state;

    const rowClass = rowClassName ? callOrReturn(rowClassName, { rowData, rowIndex }) : '';
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const key = rowData[rowKey!];

    return [rowClass, selectedRowKeys.includes(key) && 'row-selected'].filter(Boolean).concat(' ');
  };

  render(): JSX.Element {
    const { columns, children, selectable, selectionColumnProps, ...rest } = this.props;
    const { selectedRowKeys } = this.state;

    // you'd better memoize this operation
    let _columns = columns || normalizeColumns([children]);
    if (selectable) {
      const selectionColumn: ColumnShape = {
        width: 40,
        flexShrink: 0,
        resizable: false,
        frozen: Column.FrozenDirection.LEFT,
        cellRenderer: SelectionCell,
        ...selectionColumnProps,
        key: '__selection__',
        rowKey: this.props.rowKey,
        selectedRowKeys: selectedRowKeys,
        onChange: this._handleSelectChange,
      };
      _columns = [selectionColumn, ..._columns];
    }

    return <StyledTable {...rest} columns={_columns} rowClassName={this._rowClassName} />;
  }
}

// defaultProps exist AND TypeScript and React don't play well here
// Trying to set defaults for some props is nearly impossible.
// https://dev.to/bytebodger/default-props-in-react-typescript-2o5o#:~:text=Default%20Props%20in%20React%2FTypeScript%201%20The%20Setup.%20Our,...%208%20It%20Shouldn%27t%20Be%20This%20Hard.%20
// https://github.com/microsoft/TypeScript/issues/31247#issuecomment-489962705
// @ts-expect-error
SelectableTable.defaultProps = {
  ...BaseTable.defaultProps,
  multiSelect: true,
  onRowSelect: noop,
  onSelectedRowsChange: noop,
};
