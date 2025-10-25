import React from 'react'
import { Link, useNavigate, Outlet } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../i18n'
import { Home, MapPin, Bell, LogOut, User, Languages } from 'lucide-react'
import NotificationBadge from '../common/NotificationBadge'
import ThemeSwitcher from '../common/ThemeSwitcher'

export default function ParentLayout({ children }) {
  const { user, logout } = useUserStore();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
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
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 hover:shadow-md transition-all duration-200"
                title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
              >
                <Languages className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {language === 'vi' ? 'EN' : 'VI'}
                </span>
              </button>
              
              {/* Theme Switcher */}
              <ThemeSwitcher />
              
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name || t(language, 'parent_role')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
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
            className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t(language, 'notifications')}</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
