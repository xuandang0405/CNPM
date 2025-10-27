import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext({ addToast: () => {} })

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(({ type = 'info', title, message, duration = 2500 }) => {
    const id = Math.random().toString(36).slice(2)
    const toast = { id, type, title, message }
    setToasts((prev) => [toast, ...prev])
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
    return id
  }, [remove])

  const value = useMemo(() => ({ addToast }), [addToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed z-[100] top-4 right-4 space-y-2 w-[90vw] max-w-sm">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

function Toast({ toast, onClose }) {
  const { type, title, message } = toast
  const styles = {
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    error: 'bg-red-600 text-white'
  }
  return (
    <div className={`shadow-lg rounded-xl ${styles[type] || styles.info} overflow-hidden`}> 
      <div className="p-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold text-sm truncate">{title}</div>}
          {message && <div className="text-sm opacity-90 break-words">{message}</div>}
        </div>
        <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">✕</button>
      </div>
    </div>
  )
}

export default ToastProvider
