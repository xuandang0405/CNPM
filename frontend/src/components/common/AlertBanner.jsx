import React from 'react'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function AlertBanner({ type='info', message }){
  const { lang } = useUserStore()
  if (!message) return null
  const colors = {
    info: 'bg-blue-50 text-blue-800',
    warn: 'bg-yellow-50 text-yellow-800',
    danger: 'bg-red-50 text-red-800'
  }
  return (
    <div className={`p-3 rounded ${colors[type] || colors.info} mb-4`}>
      <div className="font-semibold">{t(lang,'alert')}</div>
      <div className="text-sm">{message}</div>
    </div>
  )
}
