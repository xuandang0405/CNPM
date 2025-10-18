import React, { useEffect, useState } from 'react'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'
import { listNotifications } from '../../api/notifications'

export default function ParentNotifications() {
  const { lang } = useUserStore()
  const [items, setItems] = useState([])

  useEffect(()=>{
    async function load(){ setItems(await listNotifications()) }
    load()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-xl mb-2">{t(lang,'notifications')}</h2>
      <div className="card">
        {items.length === 0 && <div className="muted">{t(lang,'no_data')}</div>}
        <div className="space-y-2">
          {items.map(n => (
            <div key={n.id} className="p-3 bg-white rounded shadow">
              <div className="text-sm muted">{new Date(n.date).toLocaleString()}</div>
              <div>{n.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
