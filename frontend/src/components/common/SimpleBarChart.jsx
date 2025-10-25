import React from 'react'

export default function SimpleBarChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          {title}
        </h4>
      )}
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100
          
          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.value}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out group-hover:from-blue-600 group-hover:to-purple-700"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
