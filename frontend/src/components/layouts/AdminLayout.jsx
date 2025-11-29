import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminTracking from '../../pages/admin/Tracking'
import AdminSchedule from '../../pages/admin/Schedule'
import Dashboard from '../../pages/admin/Dashboard'
import Buses from '../../pages/admin/Buses'
import Drivers from '../../pages/admin/Drivers'
import Users from '../../pages/admin/Users'
import Parents from '../../pages/admin/Parents'
import Students from '../../pages/admin/Students'
import RoutesPage from '../../pages/admin/Routes'
import AdminNotifications from '../../pages/admin/Notifications'
import AdminNotificationsHistory from '../../pages/admin/NotificationsHistory'
import SessionManager from '../../pages/admin/SessionManager'
import PasswordResets from '../../pages/admin/PasswordResets'
import AdminSidebar from './AdminSidebar'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../i18n'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/common/Modal'

export default function AdminLayout() {
  const { language } = useLanguage()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { logout } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <AdminSidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t(language,'admin_panel')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t(language,'smart_school_bus')}
                </p>
              </div>
            </div>
            
            {/* Right header actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              
              <ThemeSwitcher />

              {/* Logout */}
              <button
                onClick={() => setConfirmOpen(true)}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t(language,'logout')}</span>
              </button>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="" element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="parents" element={<Parents />} />
              <Route path="password-resets" element={<PasswordResets />} />
              <Route path="students" element={<Students />} />
              <Route path="tracking" element={<AdminTracking />} />
              <Route path="schedule" element={<AdminSchedule />} />
              <Route path="buses" element={<Buses />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="notifications-history" element={<AdminNotificationsHistory />} />
              <Route path="session" element={<SessionManager />} />
            </Routes>
          </div>
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
              onClick={() => { setConfirmOpen(false); try { logout() } catch(e) {} window.location.replace('/login') }}
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              {t(language,'logout')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
