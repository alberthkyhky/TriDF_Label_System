import { useState, useCallback, useMemo } from 'react';

type ValidationRule<T> = (value: T) => string | null;

interface FieldConfig<T> {
  value: T;
  rules?: ValidationRule<T>[];
  required?: boolean;
}

interface FormConfig {
  [key: string]: FieldConfig<any>;
}

interface FieldState {
  value: any;
  error: string | null;
  touched: boolean;
}

export function useFormValidation<T extends FormConfig>(initialConfig: T) {
  const [fields, setFields] = useState<Record<keyof T, FieldState>>(() => {
    const initialFields: Record<keyof T, FieldState> = {} as any;
    
    Object.keys(initialConfig).forEach(key => {
      initialFields[key as keyof T] = {
        value: initialConfig[key].value,
        error: null,
        touched: false
      };
    });
    
    return initialFields;
  });

  const validateField = useCallback((fieldName: keyof T, value: any): string | null => {
    const config = initialConfig[fieldName];
    
    // Check required validation
    if (config.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${String(fieldName)} is required`;
    }
    
    // Run custom validation rules
    if (config.rules) {
      for (const rule of config.rules) {
        const error = rule(value);
        if (error) return error;
      }
    }
    
    return null;
  }, [initialConfig]);

  const setValue = useCallback((fieldName: keyof T, value: any) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        error: validateField(fieldName, value),
        touched: true
      }
    }));
  }, [validateField]);

  const setError = useCallback((fieldName: keyof T, error: string | null) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error
      }
    }));
  }, []);

  const validateAll = useCallback(() => {
    const newFields = { ...fields };
    let hasErrors = false;

    Object.keys(initialConfig).forEach(key => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, newFields[fieldName].value);
      newFields[fieldName] = {
        ...newFields[fieldName],
        error,
        touched: true
      };
      if (error) hasErrors = true;
    });

    setFields(newFields);
    return !hasErrors;
  }, [fields, initialConfig, validateField]);

  const reset = useCallback(() => {
    const resetFields: Record<keyof T, FieldState> = {} as any;
    
    Object.keys(initialConfig).forEach(key => {
      resetFields[key as keyof T] = {
        value: initialConfig[key].value,
        error: null,
        touched: false
      };
    });
    
    setFields(resetFields);
  }, [initialConfig]);

  const values = useMemo(() => {
    const vals: Record<keyof T, any> = {} as any;
    Object.keys(fields).forEach(key => {
      vals[key as keyof T] = fields[key as keyof T].value;
    });
    return vals;
  }, [fields]);

  const errors = useMemo(() => {
    const errs: Record<keyof T, string | null> = {} as any;
    Object.keys(fields).forEach(key => {
      errs[key as keyof T] = fields[key as keyof T].error;
    });
    return errs;
  }, [fields]);

  const isValid = useMemo(() => {
    return Object.values(fields).every(field => !field.error);
  }, [fields]);

  const isDirty = useMemo(() => {
    return Object.values(fields).some(field => field.touched);
  }, [fields]);

  return {
    fields,
    values,
    errors,
    isValid,
    isDirty,
    setValue,
    setError,
    validateAll,
    reset
  };
}

// Common validation rules
export const validationRules = {
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Please enter a valid email address';
  },
  
  minLength: (min: number) => (value: string) => {
    return value.length >= min ? null : `Must be at least ${min} characters long`;
  },
  
  maxLength: (max: number) => (value: string) => {
    return value.length <= max ? null : `Must be no more than ${max} characters long`;
  },
  
  number: (value: string) => {
    return !isNaN(Number(value)) ? null : 'Must be a valid number';
  },
  
  positive: (value: number) => {
    return value > 0 ? null : 'Must be a positive number';
  }
};

export default useFormValidation;