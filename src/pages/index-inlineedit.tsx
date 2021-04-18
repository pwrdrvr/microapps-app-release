import styles from '../styles/InlineEdit.module.scss';
import React from 'react';
import { Overlay } from 'react-overlays';
import BaseTable from 'react-base-table';

const generateColumns = (count = 10, prefix = 'column-', props) =>
  new Array(count).fill(0).map((column, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }));

const generateData = (columns, count = 200, prefix = 'row-') =>
  new Array(count).fill(0).map((row, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`;
        return rowData;
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      },
    );
  });

class EditableCell extends React.PureComponent {
  state = {
    value: this.props.cellData,
    editing: false,
  };

  setTargetRef = (ref) => (this.targetRef = ref);

  getTargetRef = () => this.targetRef;

  handleClick = () => this.setState({ editing: true });

  handleHide = () => this.setState({ editing: false });

  handleChange = (e) =>
    this.setState({
      value: e.target.value,
      editing: false,
    });

  render() {
    const { container, rowIndex, columnIndex } = this.props;
    const { value, editing } = this.state;

    console.log('XXXX EditableCell - Render()');

    return (
      <div className={styles.CellContainer} ref={this.setTargetRef} onClick={this.handleClick}>
        {!editing && value}
        {editing && this.targetRef && (
          <Overlay
            show
            flip
            rootClose
            //container={this.getTargetRef}
            target={this.getTargetRef}
            onHide={this.handleHide}
          >
            {({ props, placement }) => {
              console.log('YYYY - select render');

              return (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    width: this.targetRef.offsetWidth,
                    backgroundColor: 'green',
                    top:
                      placement === 'top'
                        ? this.targetRef.offsetHeight
                        : -this.targetRef.offsetHeight,
                  }}
                >
                  <select className={styles.Select} value={value} onChange={this.handleChange}>
                    <option value="grapefruit">Grapefruit</option>
                    <option value="lime">Lime</option>
                    <option value="coconut">Coconut</option>
                    <option value="mango">Mango</option>
                  </select>
                </div>

                // <div
                //   {...props}
                //   style={{
                //     ...props.style,
                //     width: this.targetRef.offsetWidth,
                //     top:
                //       placement === 'top'
                //         ? this.targetRef.offsetHeight
                //         : -this.targetRef.offsetHeight,
                //   }}
                // >
                //   <Select value={value} onChange={this.handleChange}>
                //     <option value="grapefruit">Grapefruit</option>
                //     <option value="lime">Lime</option>
                //     <option value="coconut">Coconut</option>
                //     <option value="mango">Mango</option>
                //   </Select>
                // </div>
              );
            }}
          </Overlay>
        )}
      </div>
    );
  }
}

// const columns: ColumnShape[] = [
//   {
//     width: 150,
//     key: 'AppName',
//     dataKey: 'AppName',
//     title: 'AppName',
//     sortable: true,
//   },
//   {
//     width: 150,
//     key: 'DisplayName',
//     dataKey: 'DisplayName',
//     title: 'Display Name',
//     sortable: true,
//     cellRenderer: EditableCell,
//   },
// ];
// const data = [
//   { DisplayName: 'cat1', AppName: 'catApp1', value: 'dog1' },
//   { DisplayName: 'cat2', AppName: 'catApp2', value: 'dog2' },
//   { DisplayName: 'cat3', AppName: 'catApp3', value: 'dog3' },
// ];

const columns = generateColumns(5);
const data = generateData(columns, 100);

columns[0].cellRenderer = EditableCell;
columns[0].width = 300;

const InlineEdit = () => (
  <>
    <BaseTable width={700} height={400} columns={columns} data={data} />
  </>
);

export default InlineEdit;
