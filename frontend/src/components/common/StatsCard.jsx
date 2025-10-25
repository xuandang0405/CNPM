import React from 'react';

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  className = '' 
}) {
  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-white">
            {value}
          </p>
          {trend && (
            <p className="text-xs text-white/80 mt-1">
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="text-white">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { StatsCard };
