import React from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';

export const ValidatorForm = ({ children, onSubmit, ...props }) => (
  <form onSubmit={onSubmit} {...props}>
    {children}
  </form>
);

export const TextValidator = ({ validators = [], errorMessages = [], ...props }) => {
  const [error, setError] = React.useState('');
  const [value, setValue] = React.useState(props.value || '');

  const validate = (val) => {
    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i];
      if (typeof validator === 'function') {
        const result = validator(val);
        if (result !== true) {
          return errorMessages[i] || 'Validation failed';
        }
      }
    }
    return '';
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    const validationError = validate(newValue);
    setError(validationError);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <TextField
      {...props}
      value={value}
      onChange={handleChange}
      error={!!error}
      helperText={error}
    />
  );
};

export const SelectValidator = ({ validators = [], errorMessages = [], children, ...props }) => {
  const [error, setError] = React.useState('');
  const [value, setValue] = React.useState(props.value || '');

  const validate = (val) => {
    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i];
      if (typeof validator === 'function') {
        const result = validator(val);
        if (result !== true) {
          return errorMessages[i] || 'Validation failed';
        }
      }
    }
    return '';
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    const validationError = validate(newValue);
    setError(validationError);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <FormControl error={!!error} {...props}>
      <InputLabel>{props.label}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
      >
        {children}
      </Select>
      {error && <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '8px' }}>{error}</div>}
    </FormControl>
  );
};