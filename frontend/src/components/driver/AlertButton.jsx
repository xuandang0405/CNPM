import React from 'react'

export default function AlertButton({ onClick }){
  return (
    <button onClick={onClick} className="fixed bottom-6 right-6 bg-red-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50">!
    </button>
  )
}
