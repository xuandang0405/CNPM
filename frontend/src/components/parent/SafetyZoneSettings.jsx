import React, { useState } from 'react'
import { t } from '../../i18n'
import useUserStore from '../../store/useUserStore'

export default function SafetyZoneSettings({ value = 500, onChange }){
  const [radius, setRadius] = useState(value)
  const { lang } = useUserStore()
  return (
    <div className="card">
      <h3 className="mb-2">{t(lang,'safety_zone')}</h3>
      <div className="flex items-center gap-3">
        <select className="form-input" value={radius} onChange={e=>setRadius(Number(e.target.value))}>
          <option value={250}>{t(lang,'meters_250') || '250 m'}</option>
          <option value={500}>{t(lang,'meters_500') || '500 m'}</option>
          <option value={1000}>{t(lang,'km_1') || '1 km'}</option>
        </select>
        <button className="btn" onClick={() => onChange && onChange(radius)}>{t(lang,'save') || 'Lưu'}</button>
      </div>
      <div className="text-sm muted mt-2">{t(lang,'safety_zone_help') || 'Hệ thống sẽ cảnh báo khi xe vào/ra khỏi vùng này.'}</div>
    </div>
  )
}
