import React, { useState, useEffect } from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { useDebouncedCallback } from '../../hooks/useDebounce';

interface DebouncedTextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  onChange: (value: string) => void;
  debounceDelay?: number;
  showSearchingIndicator?: boolean;
}

/**
 * A TextField component with built-in debouncing for better performance
 * Useful for forms where immediate validation or API calls aren't necessary
 */
const DebouncedTextField: React.FC<DebouncedTextFieldProps> = ({
  onChange,
  debounceDelay = 300,
  showSearchingIndicator = false,
  value: externalValue = '',
  ...textFieldProps
}) => {
  const [internalValue, setInternalValue] = useState<string>(externalValue as string);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounced callback for external onChange
  const debouncedOnChange = useDebouncedCallback(
    (value: string) => {
      onChange(value);
      setIsProcessing(false);
    },
    debounceDelay,
    [onChange]
  );

  // Update internal value when external value changes
  useEffect(() => {
    setInternalValue(externalValue as string);
  }, [externalValue]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
    
    if (showSearchingIndicator) {
      setIsProcessing(true);
    }
    
    debouncedOnChange(newValue);
  };

  return (
    <TextField
      {...textFieldProps}
      value={internalValue}
      onChange={handleInputChange}
      InputProps={{
        ...textFieldProps.InputProps,
        ...(showSearchingIndicator && isProcessing && {
          endAdornment: (
            <span style={{ fontSize: '0.75rem', color: '#666' }}>
              Processing...
            </span>
          )
        })
      }}
    />
  );
};

export default DebouncedTextField;