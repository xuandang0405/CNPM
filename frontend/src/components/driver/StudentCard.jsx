import React from 'react'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function StudentCard({ student, onPicked, onDropped }){
  const mapsLink = student.lat && student.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${student.lat},${student.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(student.address || '')}`

  const { lang } = useUserStore()

  return (
    <div className="p-3 bg-white rounded shadow flex items-center justify-between">
      <div>
        <div className="font-semibold">{student.name}</div>
        <div className="text-sm muted">{student.address}</div>
      </div>
      <div className="flex items-center gap-2">
        <a className="px-2 py-2 bg-yellow-500 text-white rounded text-sm" target="_blank" rel="noreferrer" href={mapsLink} title={t(lang,'navigate') || 'Dẫn đường'}>↗</a>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={()=>onPicked && onPicked(student.id)}>{t(lang,'picked') || 'Đã đón'}</button>
        <button className="px-3 py-2 bg-gray-200 rounded" onClick={()=>onDropped && onDropped(student.id)}>{t(lang,'dropped') || 'Đã trả'}</button>
      </div>
    </div>
  )
}
