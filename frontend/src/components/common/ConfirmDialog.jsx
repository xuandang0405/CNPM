import React from 'react'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'default'
  onConfirm,
  onCancel
}) {
  if (!open) return null
  const confirmClasses = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <div className="px-6 pt-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          {description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
          )}
        </div>
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl ${confirmClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
