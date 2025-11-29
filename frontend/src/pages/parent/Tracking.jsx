import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import DriverInfoCard from '../../components/parent/DriverInfoCard'
import SafetyZoneSettings from '../../components/parent/SafetyZoneSettings'
import AbsenceReportModal from '../../components/parent/AbsenceReportModal'
import RouteMap from '../../components/mapping/RouteMap'
import StudentMarker from '../../components/mapping/StudentMarker'
import { getChildren, getChildBusLocation } from '../../api/parents'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import { MapPin, Bus, User, Clock, AlertTriangle } from 'lucide-react'
import { io } from 'socket.io-client'
import axiosInstance from '../../api/axios'

export default function ParentTracking(){
  const { childId } = useParams()
  const [showAbsence, setShowAbsence] = useState(false)
  const [safetyRadius, setSafetyRadius] = useState(500)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [busLocation, setBusLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (childId && children.length > 0) {
      const child = children.find(c => String(c.id) === String(childId))
      if (child) {
        setSelectedChild(String(child.id))
        loadBusLocation(child.id)
      }
    } else if (children.length > 0 && !selectedChild) {
      setSelectedChild(String(children[0].id))
      loadBusLocation(children[0].id)
    }
  }, [childId, children])

  useEffect(() => {
    if (selectedChild) {
      loadBusLocation(selectedChild)
      // Auto refresh every 5 seconds; if realtime is active, rely primarily on socket
      const interval = setInterval(() => {
        const scheduleStatus = busLocation?.schedule?.status || busLocation?.schedule_status
        const tripStatus = busLocation?.trip?.status || busLocation?.trip_status
        const trackable = busLocation?.has_active_trip && scheduleStatus === 'in-progress' && tripStatus === 'onboard'
        if (!trackable) {
          loadBusLocation(selectedChild)
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedChild, busLocation])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const data = await getChildren()
      setChildren(data.children || [])
    } catch (error) {
      console.error('Error loading children:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBusLocation = async (childId) => {
    try {
      const data = await getChildBusLocation(childId)
      setBusLocation(data)
    } catch (error) {
      console.error('Error loading bus location:', error)
      setBusLocation(null)
    }
  }

  const currentChild = useMemo(() => children.find(c => String(c.id) === String(selectedChild)), [children, selectedChild])

  // Determine if we should show live tracking: schedule started and child onboard
  const isTrackable = useMemo(() => {
    if (!busLocation?.has_active_trip) return false
    const scheduleStatus = busLocation?.schedule?.status || busLocation?.schedule_status
    const tripStatus = busLocation?.trip?.status || busLocation?.trip_status
    return scheduleStatus === 'in-progress' && tripStatus === 'onboard'
  }, [busLocation])

  // Normalize driver info for UI card
  const driver = busLocation?.has_active_trip ? {
    name: busLocation?.driver?.name || busLocation?.driver_name || 'N/A',
    phone: busLocation?.driver?.phone || busLocation?.driver_phone || 'N/A',
    plate: busLocation?.bus?.plate || busLocation?.bus_plate || 'N/A',
    avatar: ''
  } : null

  // Socket realtime updates: only when trackable and we know the bus id
  useEffect(() => {
    if (!isTrackable || !busLocation?.bus?.id) return
    // Derive socket server URL from axios baseURL by removing trailing /api
    const apiBase = axiosInstance?.defaults?.baseURL || ''
    const socketUrl = apiBase.replace(/\/?api\/?$/i, '')
    const socket = io(socketUrl, { transports: ['websocket'] })
    const busId = busLocation.bus.id
    const onBusLocation = (payload) => {
      if (!payload || String(payload.bus_id) !== String(busId)) return
      // Update only the current location fields to minimize re-render churn
      setBusLocation(prev => {
        if (!prev) return prev
        const next = { ...prev }
        next.bus = next.bus || {}
        next.bus.current_location = {
          ...(next.bus.current_location || {}),
          lat: Number(payload.lat),
          lng: Number(payload.lng),
          speed: payload.speed != null ? Number(payload.speed) : (next.bus.current_location?.speed || 0),
          heading: payload.heading != null ? Number(payload.heading) : (next.bus.current_location?.heading || 0),
          last_update: payload.timestamp || new Date().toISOString()
        }
        return next
      })
    }
    socket.on('busLocation', onBusLocation)
    return () => {
      socket.off('busLocation', onBusLocation)
      socket.close()
    }
  }, [isTrackable, busLocation?.bus?.id])

  const { lang } = useUserStore()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20 dark:border-gray-700/60 text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{t(lang,'loading_data')}</p>
        </div>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20 dark:border-gray-700/60 text-center max-w-md w-full">
          <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <User className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            {t(lang,'no_child_info_title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">{t(lang,'no_child_info_desc')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 space-y-6 pb-8">
      {/* Header with Glass Morphism */}
      <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20 dark:border-gray-700/60">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-4 shadow-lg animate-float">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t(lang,'child_tracking')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{t(lang,'view_bus_location_for_child')}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAbsence(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <span>📝</span> {t(lang,'report_absence')}
          </button>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span>👶</span> {t(lang,'select_child_to_track')}
          </label>
          <select 
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-medium transition-all duration-200"
            value={selectedChild || ''} 
            onChange={e => setSelectedChild(e.target.value)}
          >
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.full_name} - {t(lang,'grade')} {child.grade}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700 overflow-hidden">
            <div className="h-[550px] relative">
              {isTrackable ? (
                <RouteMap 
                  buses={[{
                    id: busLocation?.bus?.id,
                    plate: busLocation?.bus?.plate,
                    lat: Number(busLocation?.bus?.current_location?.lat) || 10.7765,
                    lng: Number(busLocation?.bus?.current_location?.lng) || 106.7009,
                    speed: Number(busLocation?.bus?.current_location?.speed) || 0,
                    students: Number(busLocation?.bus?.students_onboard) || undefined
                  }]}
                  // Render student marker as children
                >
                  {busLocation?.child_stop?.lat && busLocation?.child_stop?.lng && (
                    <StudentMarker student={{
                      student_name: currentChild?.full_name,
                      display_lat: Number(busLocation.child_stop.lat),
                      display_lng: Number(busLocation.child_stop.lng),
                      stop_name: busLocation.child_stop.name,
                      trip_status: busLocation?.trip?.status || busLocation?.trip_status || 'onboard'
                    }} />
                  )}
                </RouteMap>
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800">
                  <div className="text-center p-8">
                    <div className="bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                      <Bus className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-200 text-xl font-bold mb-2">{t(lang,'no_active_trip_title')}</p>
                    <p className="text-gray-500 dark:text-gray-400">{t(lang,'no_active_trip_desc')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {/* Student Info */}
          {currentChild && (
            <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 rounded-2xl p-6 border-2 border-purple-200 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-3 shadow-lg">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{currentChild.full_name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <span>📚</span> {t(lang,'grade')} {currentChild.grade}
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-700 bg-white/60 backdrop-blur-sm rounded-xl p-3">
                  <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">{t(lang,'pickup_point')}:</span>
                    <p className="font-bold text-gray-900">{currentChild.stop_name || t(lang,'unknown')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700 bg-white/60 backdrop-blur-sm rounded-xl p-3">
                  <Bus className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">{t(lang,'route_label')}:</span>
                    <p className="font-bold text-gray-900">{currentChild.route_name || t(lang,'unknown')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Driver Info */}
          {driver && <DriverInfoCard driver={driver} />}

          {/* Trip Status */}
          <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2 text-lg">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-2">
                <Clock className="w-5 h-5 text-white" />
              </div>
              {t(lang,'trip_info_title')}
            </h3>
            {busLocation?.has_active_trip ? (
              <div className="space-y-3 text-sm">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-3 border border-green-200 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{t(lang,'status_label')}:</span>
                    <span className="font-bold text-green-700 dark:text-green-300 flex items-center gap-1">
                      <span>✅</span>
                      {(busLocation?.trip?.status || busLocation?.trip_status) === 'waiting' ? t(lang,'waiting_pickup') :
                       (busLocation?.trip?.status || busLocation?.trip_status) === 'onboard' ? t(lang,'picked_up') :
                       (busLocation?.trip?.status || busLocation?.trip_status) === 'dropped' ? t(lang,'dropped_off') : t(lang,'in_progress')}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span>🚌</span> {t(lang,'bus_label')}:
                    </span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{busLocation?.bus?.plate || busLocation?.bus_plate}</span>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-gray-700 rounded-xl p-3 border border-blue-200 dark:border-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span>⏰</span> {t(lang,'start_time')}:
                    </span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {busLocation?.schedule?.start_time || busLocation?.start_time || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-gray-700 rounded-xl p-3 border border-purple-200 dark:border-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span>👥</span> {t(lang,'students_on_bus')}:
                    </span>
                    <span className="font-bold text-purple-900 dark:text-purple-300">{busLocation?.bus?.students_onboard ?? busLocation?.students_onboard ?? 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-700 dark:to-gray-700 rounded-2xl p-4 mb-3">
                  <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">{t(lang,'no_active_trip_now')}</p>
              </div>
            )}
          </div>

          {/* Safety Zone */}
          <SafetyZoneSettings value={safetyRadius} onChange={r => setSafetyRadius(r)} />
        </div>
      </div>

      {/* Absence Modal */}
      <AbsenceReportModal 
        open={showAbsence} 
        onClose={() => setShowAbsence(false)} 
        onSubmit={(data) => console.log('absence', data)} 
      />
    </div>
  )
}
