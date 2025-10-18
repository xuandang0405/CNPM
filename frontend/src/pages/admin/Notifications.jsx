import React, { useEffect, useState } from 'react'
import { listNotifications, sendNotification } from '../../api/notifications'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function AdminNotifications(){
  const [items, setItems] = useState([])
  const [text, setText] = useState('')
  const { lang } = useUserStore()
  useEffect(()=>{ load() }, [])
  async function load(){ setItems(await listNotifications()) }
  async function handleSend(){ await sendNotification({ message: text, target: 'all' }); setText(''); load() }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl mb-4">{t(lang,'notifications')}</h2>
        <div className="mb-4">
          <textarea value={text} onChange={e=>setText(e.target.value)} className="w-full p-2 border" placeholder={t(lang,'message') || 'Message to send'} />
          <div className="mt-2"><button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleSend}>{t(lang,'send')}</button></div>
        </div>
      </div>
      <div className="space-y-2">
        {items.map(n => (
          <div key={n.id} className="card">
            <div className="text-sm text-gray-500">{n.date}</div>
            <div>{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
