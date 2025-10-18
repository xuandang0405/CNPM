import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from '../../pages/driver/Home'
import Trip from '../../pages/driver/Trip'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function DriverLayout() {
  const { lang } = useUserStore()
  return (
    <div className="min-h-screen">
      <header className="bg-white p-4 border-b flex justify-between items-center">
        <h3 className="font-bold">{t(lang,'drivers')}</h3>
        <div className="flex items-center gap-4">
          <nav>
            <Link to="/driver">Home</Link>
          </nav>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>
      <main className="p-4">
        <Routes>
          <Route path="" element={<Home />} />
          <Route path="trip/:id" element={<Trip />} />
        </Routes>
      </main>
    </div>
  )
}
