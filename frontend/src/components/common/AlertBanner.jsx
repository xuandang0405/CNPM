import React from 'react';
import { X } from 'lucide-react';

export default function AlertBanner({ type = 'info', message, onClose, className = '' }) {
  if (!message) return null;

  const colors = {
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-800',
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[type] || colors.info} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{message}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export { AlertBanner };
