import React, { useState } from 'react'
import { t } from '../../i18n'
import useUserStore from '../../store/useUserStore'

export default function AbsenceReportModal({ open, onClose, onSubmit }){
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const { lang } = useUserStore()
  if (!open) return null
  return (
    // Outer backdrop: high z-index so it sits above map/leaflet panes. On mobile items align to bottom for a sheet.
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[99999]">
      <div className="bg-white p-4 w-full max-w-md rounded-t-lg sm:rounded-lg">
        <h3 className="heading mb-2">{t(lang,'report_absence')}</h3>
        <div className="space-y-2">
          <div>
            <label className="text-sm">{t(lang,'date') || 'Ngày'}</label>
            <input type="date" className="form-input mt-1" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">{t(lang,'reason') || 'Lý do'}</label>
            <input className="form-input mt-1" value={reason} onChange={e=>setReason(e.target.value)} placeholder={t(lang,'reason_placeholder') || 'Ví dụ: Ốm, Ra ngoại'} />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>{t(lang,'close')}</button>
          <button className="btn" onClick={() => { onSubmit && onSubmit({ date, reason }); onClose && onClose() }}>{t(lang,'send')}</button>
        </div>
      </div>
    </div>
  )
}
