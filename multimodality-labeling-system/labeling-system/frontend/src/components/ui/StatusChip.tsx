import React from 'react';

interface StatusChipProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

type VariantType = 'default' | 'success' | 'warning' | 'error' | 'info';

const variantStyles: Record<VariantType, string> = {
  default: 'bg-gray-100 text-gray-800 border-gray-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200'
};

const sizeStyles = {
  small: 'px-2 py-1 text-xs',
  medium: 'px-3 py-1 text-sm',
  large: 'px-4 py-2 text-base'
} as const;

function getAutoVariant(status: string): VariantType {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('complete') || statusLower.includes('success') || statusLower.includes('active')) {
    return 'success';
  }
  if (statusLower.includes('pending') || statusLower.includes('waiting') || statusLower.includes('assigned')) {
    return 'warning';
  }
  if (statusLower.includes('error') || statusLower.includes('failed') || statusLower.includes('inactive')) {
    return 'error';
  }
  if (statusLower.includes('info') || statusLower.includes('progress')) {
    return 'info';
  }
  
  return 'default';
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  variant = 'default',
  size = 'medium',
  className = ''
}) => {
  // Auto-detect variant based on status text if variant is default
  const autoVariant = variant === 'default' ? getAutoVariant(status) : variant;

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${variantStyles[autoVariant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {status}
    </span>
  );
};

export default StatusChip;