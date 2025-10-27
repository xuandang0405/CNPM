import React, { useEffect, useMemo, useState } from 'react'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import AdminDriverMap from '../../components/mapping/AdminDriverMap'
import { getActiveDriversAdmin, getScheduleStudentsAdmin } from '../../api/trips'
import { UserCircle2, MapPin } from 'lucide-react'

export default function AdminTracking() {
  const { lang } = useUserStore()
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // selected driver row
  const [students, setStudents] = useState([])

  useEffect(() => {
    loadActiveDrivers()
    // Refresh every 10 seconds
    const interval = setInterval(loadActiveDrivers, 10000)
    return () => clearInterval(interval)
  }, [])

  // Poll students for selected driver every 10s
  useEffect(() => {
    if (!selected?.schedule_id) return
    const fetchStudents = async () => {
      try {
        const data = await getScheduleStudentsAdmin(selected.schedule_id)
        setStudents(data.students || [])
      } catch (e) {
        // ignore transient errors
      }
    }
    fetchStudents()
    const interval = setInterval(fetchStudents, 10000)
    return () => clearInterval(interval)
  }, [selected?.schedule_id])

  const loadActiveDrivers = async () => {
    try {
      const data = await getActiveDriversAdmin()
      const list = data.drivers || []
      setDrivers(list)
      // Auto-select first driver if none selected
      if (!selected && list.length > 0) {
        handleSelectDriver(list[0])
      } else if (selected) {
        // Sync selected with latest info (e.g., updated bus location)
        const updated = list.find(d => d.driver_id === selected.driver_id && d.schedule_id === selected.schedule_id) || selected
        setSelected(updated)
      }
    } catch (error) {
      console.error('Error loading active drivers:', error)
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectDriver = async (driverRow) => {
    setSelected(driverRow)
    setStudents([])
    if (!driverRow?.schedule_id) return
    try {
      const data = await getScheduleStudentsAdmin(driverRow.schedule_id)
      setStudents(data.students || [])
    } catch (e) {
      console.error('Failed to load students for schedule', driverRow.schedule_id, e)
      setStudents([])
    }
  }

  // Merge trips data with realtime bus locations
  const selectedBus = useMemo(() => selected ? {
    bus_id: selected.bus_id,
    bus_plate: selected.bus_plate,
    current_lat: selected.current_lat,
    current_lng: selected.current_lng,
    speed: selected.speed,
    heading: selected.heading,
    students_onboard: selected.students_onboard,
  } : null, [selected])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <span className="text-3xl">📍</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold">{t(lang, 'tracking')}</h2>
                <p className="text-orange-100 mt-1">
                  {loading ? t(lang, 'loading') : `${drivers.length} ${t(lang, 'active_drivers')}`}
                </p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-sm text-orange-100">{t(lang, 'update')}</div>
              <div className="text-lg font-bold">{t(lang, 'every_10s')}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="h-[600px]">
                <AdminDriverMap bus={selectedBus} students={students} />
              </div>
            </div>
          </div>

          {/* Sidebar - Bus Status */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">�‍✈️</span>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t(lang, 'drivers')}</h3>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin text-4xl mb-2">⏳</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t(lang, 'loading')}</p>
                </div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">🅿️</span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t(lang, 'no_active_trip_now')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto">
                  {drivers.map(d => {
                    const isSelected = selected && d.driver_id === selected.driver_id && d.schedule_id === selected.schedule_id
                    return (
                      <button
                        key={`${d.driver_id}-${d.schedule_id}`}
                        onClick={() => handleSelectDriver(d)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30">
                              <UserCircle2 className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-gray-100">{d.driver_name || 'N/A'}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-300">{d.bus_plate} • {d.route_name}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {d.current_lat?.toFixed ? d.current_lat.toFixed(3) : d.current_lat}, {d.current_lng?.toFixed ? d.current_lng.toFixed(3) : d.current_lng}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
