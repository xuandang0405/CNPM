import React from 'react'
import { Bell } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import useNotifications from '../../hooks/useNotifications'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../i18n'

export default function NotificationBadge({ role = 'parent', className = '' }) {
  const { unreadCount } = useNotifications()
  const { language } = useLanguage()
  const location = useLocation()
  
  const notificationPath = role === 'admin' 
    ? '/admin/notifications' 
    : role === 'driver' 
    ? '/driver/notifications' 
    : '/parent/notifications'
  
  const isActive = location.pathname === notificationPath

  // Style for admin/driver sidebars (full width navigation item)
  if (role === 'admin' || role === 'driver') {
    return (
      <Link 
        to={notificationPath}
        className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-md ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-105'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60'
        } ${className}`}
      >
        <div className={`${
          isActive 
            ? 'bg-white/20' 
            : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
        } p-2 rounded-lg mr-3 transition-colors duration-200 relative`}>
          <Bell className={`${
            isActive 
              ? 'text-white' 
              : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
          } h-5 w-5 transition-colors duration-200`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-600 rounded-full animate-pulse">
              {unreadCount > 99 ? '99' : unreadCount}
            </span>
          )}
        </div>
        <span className="truncate">{t(language, 'notifications')}</span>
        {unreadCount > 0 && !isActive && (
          <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    )
  }

  // Style for parent header (icon with text)
  return (
    <Link 
      to={notificationPath}
      className={`flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors ${className}`}
    >
      <div className="relative">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full animate-pulse">
            {unreadCount > 99 ? '99' : unreadCount}
          </span>
        )}
      </div>
      <span>{t(language, 'notifications')}</span>
    </Link>
  )
}
