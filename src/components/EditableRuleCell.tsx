import styles from '../styles/EditableRuleCell.module.scss';
import React, { ChangeEvent, RefObject } from 'react';
import { Overlay } from 'react-overlays';
import { IVersion } from '../store/main';
import { Select, SelectItem } from 'carbon-components-react';
import { noop } from '../utils/noop';

interface IProps {
  container?: JSX.Element;
  rowIndex?: number;
  columnIndex?: number;
  cellData: string;
  versions: IVersion[];
  onVersionSelected?: (args: { version: IVersion }) => void;
}

interface IState {
  value: string;
  editing: boolean;
}

export default class EditableRuleCell extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      value: this.props.cellData,
      editing: false,
    };

    this.render = this.render.bind(this);
  }

  private targetRef!: HTMLElement;

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

    const selectedItem = this.props.versions.find((item) => {
      if (item.SemVer === e.target.value) {
        return item;
      }
    });
    if (selectedItem === undefined) {
      return;
    }

    // Call any external event handler
    if (this.props.onVersionSelected !== undefined) {
      this.props.onVersionSelected({ version: selectedItem });
    }
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
                <Select
                  id={'VersionSelect'}
                  className={styles.FruitSelect}
                  value={value}
                  hideLabel
                  onChange={this.handleChange}
                >
                  {this.props.versions.map((version) => (
                    <SelectItem
                      key={version.SemVer}
                      id={version.SemVer}
                      text={version.SemVer}
                      value={version.SemVer}
                    >
                      {version.SemVer}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}
          </Overlay>
        )}
      </div>
    );
  }
}

// defaultProps exist AND TypeScript and React don't play well here
// Trying to set defaults for some props is nearly impossible.
// https://dev.to/bytebodger/default-props-in-react-typescript-2o5o#:~:text=Default%20Props%20in%20React%2FTypeScript%201%20The%20Setup.%20Our,...%208%20It%20Shouldn%27t%20Be%20This%20Hard.%20
// https://github.com/microsoft/TypeScript/issues/31247#issuecomment-489962705
// @ts-expect-error
EditableRuleCell.defaultProps = {
  onVersionSelected: noop,
};
