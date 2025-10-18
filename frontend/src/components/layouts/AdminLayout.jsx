import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminTracking from '../../pages/admin/Tracking'
import AdminSchedule from '../../pages/admin/Schedule'
import Dashboard from '../../pages/admin/Dashboard'
import Buses from '../../pages/admin/Buses'
import Drivers from '../../pages/admin/Drivers'
import RoutesPage from '../../pages/admin/Routes'
import ScheduleManager from '../../pages/admin/ScheduleManager'
import AdminNotifications from '../../pages/admin/Notifications'
import SessionManager from '../../pages/admin/SessionManager'
import AdminSidebar from './AdminSidebar'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function AdminLayout() {
  const { lang } = useUserStore()
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 bg-gray-100 min-h-screen">
        <header className="bg-white border-b">
          <div className="app-container flex items-center justify-between py-3">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">{t(lang,'dashboard') || 'SchoolBus Admin'}</h1>
              <div className="muted text-sm">{t(lang,'admin_subtitle') || 'Quản lý xe buýt và lịch trình'}</div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded">{t(lang,'create') || 'Tạo mới'}</button>
              </div>
              <div>
                <LanguageSwitcher />
              </div>
              <div>
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </header>
        <main className="app-container py-6">
          <Routes>
            <Route path="" element={<Dashboard />} />
            <Route path="tracking" element={<AdminTracking />} />
            <Route path="schedule" element={<AdminSchedule />} />
            <Route path="buses" element={<Buses />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="schedule-manager" element={<ScheduleManager />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="session" element={<SessionManager />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
