import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: '⚠️',
      confirmButton: 'bg-red-500 hover:bg-red-600 text-white',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: '⚡',
      confirmButton: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      iconColor: 'text-yellow-500'
    },
    info: {
      icon: 'ℹ️',
      confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white',
      iconColor: 'text-blue-500'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className={`text-2xl ${styles.iconColor}`}>{styles.icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded transition-colors ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;