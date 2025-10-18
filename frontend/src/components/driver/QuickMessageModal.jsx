import React, { useState } from 'react'
import { sendNotification } from '../../api/notifications'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

const TEMPLATES = [
  'Kẹt xe',
  'Trễ 10 phút',
  'Xe bị hỏng',
  'Đã rời bến'
]

export default function QuickMessageModal({ open, onClose, onSend }){
  const [custom, setCustom] = useState('')
  const { lang } = useUserStore()
  if (!open) return null
  async function send(msg){
    // mock send
    await sendNotification({ message: msg, type: 'driver' })
    onSend && onSend(msg)
  }
  return (
    // High z-index and bottom-aligned on small screens to avoid Leaflet panes covering the modal
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[99999]">
      <div className="bg-white p-4 w-full max-w-md rounded-t-lg sm:rounded-lg">
  <h3 className="heading mb-2">{t(lang,'quick_send')}</h3>
        <div className="space-y-2">
          {TEMPLATES.map(template => (
            <button key={template} className="w-full p-3 bg-gray-100 rounded" onClick={() => { send(template); onClose && onClose() }}>{template}</button>
          ))}
          <div>
            <textarea className="form-input w-full" rows={3} value={custom} onChange={e=>setCustom(e.target.value)} placeholder={t(lang,'custom_message') || 'Tin nhắn tuỳ chỉnh'} />
            <div className="mt-2 text-right">
              <button className="btn" onClick={() => { if (custom.trim()) { send(custom); onClose && onClose() } }}>{t(lang,'send')}</button>
            </div>
          </div>
        </div>
        <div className="mt-3 text-right">
          <button className="btn btn-ghost" onClick={onClose}>{t(lang,'close')}</button>
        </div>
      </div>
    </div>
  )
}
