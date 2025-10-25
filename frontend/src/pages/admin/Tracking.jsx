import React, { useEffect, useState } from 'react'
import RouteMap from '../../components/mapping/RouteMap'
import BusStatusList from '../../components/common/BusStatusList'
import useRealtimeLocation from '../../hooks/useRealtimeLocation'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import axiosInstance from '../../api/axios'

export default function AdminTracking() {
  const { buses } = useRealtimeLocation({ mode: 'all' })
  const { lang } = useUserStore()
  const [activeTrips, setActiveTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActiveTrips()
    // Refresh every 10 seconds
    const interval = setInterval(loadActiveTrips, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadActiveTrips = async () => {
    try {
      const response = await axiosInstance.get('/api/trips/active')
      setActiveTrips(response.data.trips || [])
    } catch (error) {
      console.error('Error loading active trips:', error)
      setActiveTrips([])
    } finally {
      setLoading(false)
    }
  }

  // Merge trips data with realtime bus locations
  const activeBuses = activeTrips.map(trip => ({
    id: trip.bus_id,
    plate: trip.bus_plate,
    lat: trip.current_lat,
    lng: trip.current_lng,
    speed: trip.speed,
    heading: trip.heading,
    students_onboard: trip.students_onboard,
    route_name: trip.route_name,
    driver_name: trip.driver_name,
    driver_phone: trip.driver_phone,
    trip_id: trip.id,
    status: trip.status
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <span className="text-3xl">📍</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold">Theo dõi xe buýt</h2>
                <p className="text-orange-100 mt-1">
                  {loading ? 'Đang tải...' : `${activeTrips.length} xe đang chạy`}
                </p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-sm text-orange-100">Cập nhật</div>
              <div className="text-lg font-bold">10s/lần</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="h-[600px]">
                <RouteMap buses={activeBuses} />
              </div>
            </div>
          </div>

          {/* Sidebar - Bus Status */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🚌</span>
                <h3 className="text-lg font-bold text-gray-800">Trạng thái xe</h3>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin text-4xl mb-2">⏳</div>
                  <p className="text-gray-500 text-sm">Đang tải...</p>
                </div>
              ) : activeTrips.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">🅿️</span>
                  <p className="text-gray-500 text-sm">Không có xe nào đang chạy</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto">
                  {activeBuses.map(bus => (
                    <div 
                      key={bus.id} 
                      className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-mono font-bold text-gray-800">{bus.plate}</div>
                          <div className="text-xs text-gray-600">{bus.route_name}</div>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {bus.status || 'Đang chạy'}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <span>👨‍✈️</span>
                          <span>{bus.driver_name || 'N/A'}</span>
                        </div>
                        {bus.students_onboard > 0 && (
                          <div className="flex items-center gap-1">
                            <span>👥</span>
                            <span>{bus.students_onboard} học sinh</span>
                          </div>
                        )}
                        {bus.speed && (
                          <div className="flex items-center gap-1">
                            <span>🚀</span>
                            <span>{bus.speed} km/h</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
