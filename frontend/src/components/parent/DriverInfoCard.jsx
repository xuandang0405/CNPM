import React from 'react'
import { t } from '../../i18n'
import useUserStore from '../../store/useUserStore'

export default function DriverInfoCard({ driver = {} }){
  const { lang } = useUserStore()
  if (!driver) return null
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <img src={driver.avatar || 'https://ui-avatars.com/api/?name='+encodeURIComponent(driver.name)} alt="driver" className="w-14 h-14 rounded-full object-cover" />
        <div>
          <div className="font-semibold">{driver.name}</div>
          <div className="text-sm muted">{t(lang,'drivers')}</div>
        </div>
      </div>

      <div className="mt-3 text-sm">
        <div>{t(lang,'message')}: <a className="text-blue-600" href={`tel:${driver.phone}`}>{driver.phone}</a></div>
        <div className="mt-2 muted">{t(lang,'bus')}: {driver.plate}</div>
      </div>
    </div>
  )
}
