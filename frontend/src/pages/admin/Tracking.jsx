import React from 'react'
import RouteMap from '../../components/mapping/RouteMap'
import BusStatusList from '../../components/common/BusStatusList'
import useRealtimeLocation from '../../hooks/useRealtimeLocation'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function AdminTracking() {
  const { buses } = useRealtimeLocation({ mode: 'all' })
  const { lang } = useUserStore()

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-3 card h-[600px] p-0 overflow-hidden">
        <RouteMap buses={buses} />
      </div>
      <div className="col-span-1">
        <div className="card">
          <h3 className="mb-3">{t(lang,'bus_status') || 'Bus Status'}</h3>
          <BusStatusList buses={buses} />
        </div>
      </div>
    </div>
  )
}
