import React from 'react'
export default function ConfirmDialog({ open, title, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow">
        <h3 className="font-bold mb-3">{title}</h3>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1" onClick={onCancel}>Cancel</button>
          <button className="px-3 py-1 bg-red-600 text-white" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
