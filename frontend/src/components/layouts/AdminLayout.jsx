import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminTracking from '../../pages/admin/Tracking'
import AdminSchedule from '../../pages/admin/Schedule'
import Dashboard from '../../pages/admin/Dashboard'
import Buses from '../../pages/admin/Buses'
import Drivers from '../../pages/admin/Drivers'
import Users from '../../pages/admin/Users'
import Students from '../../pages/admin/Students'
import RoutesPage from '../../pages/admin/Routes'
import AdminNotifications from '../../pages/admin/Notifications'
import SessionManager from '../../pages/admin/SessionManager'
import AdminSidebar from './AdminSidebar'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import { useLanguage } from '../../contexts/LanguageContext'
import { t } from '../../i18n'

export default function AdminLayout() {
  const { language } = useLanguage()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="" element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="students" element={<Students />} />
              <Route path="tracking" element={<AdminTracking />} />
              <Route path="schedule" element={<AdminSchedule />} />
              <Route path="buses" element={<Buses />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="session" element={<SessionManager />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}
