import React from 'react'
import Button from './Button'
import { t } from '../../i18n'
import useUserStore from '../../store/useUserStore'

export default function BusStatusList({ buses = [] }) {
  const { lang } = useUserStore()
  return (
    <div className="space-y-3">
      {buses.map(b => (
        <div key={b.id} className="card">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold">{b.id}</div>
              <div className="muted text-sm">{b.plate ?? ''}</div>
            </div>
            <div className="text-right">
              <div className="text-sm muted">Speed</div>
              <div className="font-semibold">{b.speed ?? '-' } km/h</div>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center">
            <div className="text-sm">Students: <strong>{b.students ?? '-'}</strong></div>
            <div className="flex gap-2">
              <Button variant="secondary">Detail</Button>
              <Button variant="danger">Message</Button>
            </div>
          </div>
        </div>
      ))}
      {buses.length === 0 && <div className="muted">{t(lang,'no_buses')}</div>}
    </div>
  )
}
