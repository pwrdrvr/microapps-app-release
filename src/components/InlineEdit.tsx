import styles from '../styles/InlineEdit.module.scss';
import React from 'react';
import Table, { ColumnShape } from 'react-base-table';
import { Overlay } from 'react-overlays';

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

    return (
      <div className={styles.CellContainer} ref={this.setTargetRef} onClick={this.handleClick}>
        {!editing && value}
        {editing && this.targetRef && (
          <Overlay
            show
            flip
            rootClose
            //container={container}
            target={this.getTargetRef}
            onHide={this.handleHide}
          >
            {({ props, placement }) => (
              <div
                {...props}
                style={{
                  ...props.style,
                  width: this.targetRef.offsetWidth,
                  top:
                    placement === 'top'
                      ? this.targetRef.offsetHeight
                      : -this.targetRef.offsetHeight,
                }}
              >
                <select className={styles.FruitSelect} value={value} onChange={this.handleChange}>
                  <option value="grapefruit">Grapefruit</option>
                  <option value="lime">Lime</option>
                  <option value="coconut">Coconut</option>
                  <option value="mango">Mango</option>
                </select>
              </div>
            )}
          </Overlay>
        )}
      </div>
    );
  }
}

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
    cellRenderer: EditableCell,
  },
];
const data = [
  { DisplayName: 'cat1', AppName: 'catApp1' },
  { DisplayName: 'cat2', AppName: 'catApp2' },
  { DisplayName: 'cat3', AppName: 'catApp3' },
];

// columns[0].cellRenderer = EditableCell;
// columns[0].width = 300;

const InlineEdit = () => (
  <>
    <Table width={700} height={400} columns={columns} data={data} />
  </>
);

export default InlineEdit;
