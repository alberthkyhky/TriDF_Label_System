import React from 'react';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  options?: { value: string | number; label: string }[];
  rows?: number;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  options = [],
  rows = 3,
  className = ''
}) => {
  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm 
    focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
    ${error ? 'border-red-300' : 'border-gray-300'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
  `;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={baseInputClasses}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            className={baseInputClasses}
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderInput()}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FormField;