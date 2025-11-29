import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Map, 
  Users, 
  Clock, 
  AlertTriangle, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bus,
  Sun,
  Moon,
  Bell,
  
} from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../i18n';
import NotificationBadge from '../common/NotificationBadge';
import DriverHome from '../../pages/driver/Home';
import DriverMap from '../../pages/driver/Map';
import DriverTrip from '../../pages/driver/Trip';
import DriverNotifications from '../../pages/driver/Notifications';
import Modal from '../common/Modal';

export default function DriverLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const navigation = [
    { name: t(language, 'home'), href: 'home', icon: Home },
    { name: t(language, 'map'), href: 'map', icon: Map },
  ];

  const handleLogout = () => {
    try { logout(); } catch(e) {}
    navigate('/login', { replace: true });
  };

  const isCurrentPath = (path) => {
    return location.pathname === `/driver/${path}` || (path === 'home' && location.pathname === '/driver');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-72 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-white/20 dark:border-gray-700/50`}>
        
        {/* Logo & Brand */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"></div>
          <div className="relative flex items-center justify-between h-20 px-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg transform hover:scale-110 transition-transform duration-300">
                <Bus className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {t(language, 'driver_panel')}
                </h1>
                <p className="text-xs text-blue-100">
                  {t(language, 'smart_school_bus')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50">
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <span className="text-lg font-bold text-white">
                  {user?.full_name?.charAt(0) || 'D'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {user?.full_name || t(language, 'driver_role')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                {t(language, 'online')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const current = isCurrentPath(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  current
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:shadow-md'
                } group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-105`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className={`${
                  current 
                    ? 'bg-white/20' 
                    : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                } p-2 rounded-lg mr-3 transition-colors duration-200`}>
                  <Icon className={`${
                    current 
                      ? 'text-white' 
                      : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                  } h-5 w-5 transition-colors duration-200`} />
                </div>
                {item.name}
              </Link>
            );
          })}
          
          {/* Notification Badge as separate item */}
          <div className="pt-2">
            <NotificationBadge role="driver" className="w-full" />
          </div>
        </nav>

        {/* Quick Actions */}
        <div className="px-4 space-y-2">
          <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {t(language, 'utilities')}
          </p>
          
          {/* Language Switcher - styled like quick action button */}
          <LanguageSwitcher className="w-full" variant="action" />
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-md group"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 mr-3 group-hover:scale-110 transition-transform duration-200">
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-600" />
              )}
            </div>
            {t(language, theme === 'dark' ? 'light_mode' : 'dark_mode')}
          </button>

          {/* Removed Emergency Alert quick action */}
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <button
            onClick={() => setConfirmOpen(true)}
            className="w-full flex items-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-md group"
          >
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 mr-3 group-hover:scale-110 transition-all duration-200">
              <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200" />
            </div>
            {t(language, 'logout')}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header for mobile */}
        <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/50 lg:hidden sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-110"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t(language, 'driver_dashboard')}
            </h1>
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <span className="text-sm font-bold text-white">
                  {user?.full_name?.charAt(0) || 'D'}
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<DriverHome />} />
            <Route path="map" element={<DriverMap />} />
            <Route path="trip/:id?" element={<DriverTrip />} />
            <Route path="notifications" element={<DriverNotifications />} />
          </Routes>
        </main>
      </div>

      {/* Confirm Logout Modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={t(language,'logout')} size="sm">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">{t(language,'confirm_logout')}</p>
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
              {t(language,'logout')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
 
