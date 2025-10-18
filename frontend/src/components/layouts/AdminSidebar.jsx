import React from 'react'
import { NavLink } from 'react-router-dom'
import { t } from '../../i18n'
import useUserStore from '../../store/useUserStore'

export default function AdminSidebar(){
  const { lang } = useUserStore()
  const items = [
    { to: '/admin', label: t(lang, 'dashboard') },
    { to: '/admin/tracking', label: t(lang, 'tracking') },
    { to: '/admin/schedule', label: t(lang, 'schedule') },
    { to: '/admin/buses', label: t(lang, 'buses') },
    { to: '/admin/drivers', label: t(lang, 'drivers') },
    { to: '/admin/routes', label: t(lang, 'routes') },
    { to: '/admin/notifications', label: t(lang, 'notifications') },
    { to: '/admin/session', label: t(lang, 'session') },
  ]

  return (
    <aside className="w-72 bg-gradient-to-b from-indigo-700 to-indigo-900 text-white min-h-screen p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{t(lang,'dashboard') || 'SchoolBus Admin'}</h2>
        <div className="text-sm muted">{t(lang, 'admin_subtitle') || t(lang,'dashboard')}</div>
      </div>
      <nav className="flex flex-col gap-2">
        {items.map(i => (
          <NavLink key={i.to} to={i.to} className={({isActive}) => `px-3 py-2 rounded ${isActive ? 'bg-indigo-800' : 'hover:bg-indigo-800'}`}>
            {i.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
