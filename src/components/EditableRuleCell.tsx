import styles from '../styles/EditableRuleCell.module.scss';
import React, { ChangeEvent, RefObject } from 'react';
import { Overlay } from 'react-overlays';

interface IProps {
  container: JSX.Element;
  rowIndex: number;
  columnIndex: number;
  cellData: never;
}

interface IState {
  value: string;
  editing: boolean;
}

export default class EditableRuleCell extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.render = this.render.bind(this);
  }

  private targetRef!: HTMLElement;

  state = {
    value: this.props.cellData,
    editing: false,
  };

  setTargetRef = (ref: HTMLDivElement): HTMLDivElement => {
    this.targetRef = ref;
    return ref;
  };

  getTargetRef = (): HTMLElement | RefObject<HTMLElement> => this.targetRef;

  handleClick = (): void => {
    this.setState({ editing: true });
  };

  handleHide = (): void => this.setState({ editing: false });

  handleChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    this.setState({
      value: e.target.value,
      editing: false,
    });
  };

  render(): JSX.Element {
    // const { container, rowIndex, columnIndex } = this.props;
    const { value, editing } = this.state;

    return (
      <div className={styles.CellContainer} ref={this.setTargetRef} onClick={this.handleClick}>
        {!editing && value}
        {editing && this.targetRef && (
          <Overlay
            show
            flip
            rootClose
            // container={container}
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
