import React, { useEffect, useState } from 'react'
import StatsCard from '../../components/common/StatsCard'
import { listBuses } from '../../api/buses'
import { listDrivers } from '../../api/drivers'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function Dashboard() {
  const [buses, setBuses] = useState([])
  const [drivers, setDrivers] = useState([])
  const { lang } = useUserStore()

  useEffect(() => {
    async function load() {
      setBuses(await listBuses())
      setDrivers(await listDrivers())
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatsCard title={t(lang,'total_buses') || 'Total Buses'} value={buses.length} />
        <StatsCard title={t(lang,'total_drivers') || 'Total Drivers'} value={drivers.length} />
        <StatsCard title={t(lang,'active_trips') || 'Active Trips'} value={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card">{t(lang,'recent_alerts') || 'Recent Alerts placeholder'}</div>
        <div className="card">{t(lang,'recent_messages') || 'Recent Messages placeholder'}</div>
      </div>
    </div>
  )
}
