import React from 'react'
import { Link, Outlet } from 'react-router-dom'
// child routes are defined in App.jsx; this layout renders header and an Outlet
import LanguageSwitcher from '../../components/common/LanguageSwitcher'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import { t } from '../../i18n'
import useUserStore from '../../store/useUserStore'

export default function ParentLayout({ children }) {
  const { lang } = useUserStore()
  return (
    <div className="min-h-screen">
      <header className="bg-white p-4 border-b flex justify-between items-center">
        <h3 className="font-bold">{t(lang,'dashboard')}</h3>
        <nav className="flex items-center gap-4">
          <Link to="/parent">{t(lang,'tracking')}</Link>
          <Link className="ml-4" to="/parent/notifications">{t(lang,'notifications')}</Link>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </nav>
      </header>
      <main className="p-4">
        {/* If children provided (used as wrapper), render them; otherwise render nested routes via Outlet */}
        {children ?? <Outlet />}
      </main>
    </div>
  )
}
