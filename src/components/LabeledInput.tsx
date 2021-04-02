import PropTypes from 'prop-types';
import * as React from 'react';
import clsx from 'clsx';
import styles from '../styles/LabeledInput.module.css';

export function LabeledInput({
  disabled,
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  name: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  value: string;
}): JSX.Element {
  const labelClassName = clsx(styles.Label, {
    [styles.LabelDisabled]: disabled,
  });

  return (
    <div className={styles.LabeledInput}>
      <label className={labelClassName} title={label}>
        {label}
      </label>
      <input
        aria-label={label}
        className={styles.Input}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        disabled={disabled}
      />
    </div>
  );
}
LabeledInput.propTypes = {
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.any,
};

export function InputRow({ children }: { children: JSX.Element[] }): JSX.Element {
  return <div className={styles.InputRow}>{children}</div>;
}
