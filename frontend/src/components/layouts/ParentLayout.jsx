import React, { useState } from 'react'
import { Link, useNavigate, Outlet } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../i18n'
import { Home, MapPin, Bell, LogOut, User } from 'lucide-react'
import NotificationBadge from '../common/NotificationBadge'
import ThemeSwitcher from '../common/ThemeSwitcher'
import Modal from '../common/Modal'
import useNotifications from '../../hooks/useNotifications'
import LanguageSwitcher from '../common/LanguageSwitcher'

export default function ParentLayout({ children }) {
  const { user } = useUserStore();
  const { logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { unreadCount } = useNotifications()

  const handleLogout = () => {
    try { logout(); } catch(e) { /* noop */ }
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t(language, 'smart_school_bus')}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t(language, 'parent_role')}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/parent" 
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                <Home className="w-5 h-5" />
                {t(language, 'dashboard')}
              </Link>
              <Link 
                to="/parent/tracking" 
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                <MapPin className="w-5 h-5" />
                {t(language, 'tracking')}
              </Link>
              <NotificationBadge role="parent" />
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* Theme Switcher */}
              <ThemeSwitcher />
              
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name || t(language, 'parent_role')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={() => setConfirmOpen(true)}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t(language, 'logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children ?? <Outlet />}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="grid grid-cols-3 gap-1 p-2">
          <Link 
            to="/parent" 
            className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Home className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t(language, 'dashboard')}</span>
          </Link>
          <Link 
            to="/parent/tracking" 
            className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <MapPin className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t(language, 'tracking')}</span>
          </Link>
          <Link 
            to="/parent/notifications" 
            className="relative flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full animate-pulse">
                  {unreadCount > 99 ? '99' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t(language, 'notifications')}</span>
          </Link>
        </div>
      </nav>

      {/* Confirm Logout Modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={t(language, 'logout')} size="sm">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">{t(language, 'confirm_logout')}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t(language,'cancel')}
            </button>
            <button
              onClick={() => { setConfirmOpen(false); handleLogout(); }}
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              {t(language, 'logout')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
