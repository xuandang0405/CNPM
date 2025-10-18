import React from 'react'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function AdminSchedule() {
  const { lang } = useUserStore()
  return (
    <div>
      <h2 className="text-xl mb-4">{t(lang,'schedule')}</h2>
      <p>{t(lang,'manage_schedules') || 'Schedule calendar placeholder'}</p>
    </div>
  )
}
