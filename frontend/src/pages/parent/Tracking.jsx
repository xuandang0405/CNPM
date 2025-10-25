import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import DriverInfoCard from '../../components/parent/DriverInfoCard'
import SafetyZoneSettings from '../../components/parent/SafetyZoneSettings'
import AbsenceReportModal from '../../components/parent/AbsenceReportModal'
import RouteMap from '../../components/mapping/RouteMap'
import { getChildren, getChildBusLocation } from '../../api/parents'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import { MapPin, Bus, User, Clock, AlertTriangle } from 'lucide-react'

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
      const child = children.find(c => c.id === childId)
      if (child) {
        setSelectedChild(child.id)
        loadBusLocation(child.id)
      }
    } else if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].id)
      loadBusLocation(children[0].id)
    }
  }, [childId, children])

  useEffect(() => {
    if (selectedChild) {
      loadBusLocation(selectedChild)
      // Auto refresh every 5 seconds
      const interval = setInterval(() => {
        loadBusLocation(selectedChild)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedChild])

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

  const currentChild = children.find(c => c.id === selectedChild)
  const driver = busLocation?.has_active_trip ? {
    name: busLocation.driver_name || 'N/A',
    phone: busLocation.driver_phone || 'N/A',
    plate: busLocation.bus_plate || 'N/A',
    avatar: ''
  } : null

  const { lang } = useUserStore()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20 text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20 text-center max-w-md w-full">
          <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <User className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Chưa có thông tin con
          </h3>
          <p className="text-gray-600">Vui lòng liên hệ nhà trường để đăng ký xe buýt cho con</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 space-y-6 pb-8">
      {/* Header with Glass Morphism */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-4 shadow-lg animate-float">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Theo dõi xe buýt
              </h1>
              <p className="text-gray-600 mt-1">Xem vị trí xe buýt đưa đón con</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAbsence(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <span>📝</span> Báo vắng
          </button>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
          <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>👶</span> Chọn con để theo dõi:
          </label>
          <select 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white font-medium transition-all duration-200"
            value={selectedChild || ''} 
            onChange={e => setSelectedChild(e.target.value)}
          >
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.full_name} - Khối {child.grade}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="h-[550px] relative">
              {busLocation?.has_active_trip ? (
                <RouteMap 
                  buses={[{
                    id: busLocation.bus_id,
                    plate: busLocation.bus_plate,
                    lat: busLocation.current_lat || 10.7765,
                    lng: busLocation.current_lng || 106.7009,
                    speed: busLocation.speed || 0
                  }]} 
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-center p-8">
                    <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                      <Bus className="w-16 h-16 text-white" />
                    </div>
                    <p className="text-gray-700 text-xl font-bold mb-2">Không có chuyến đi hoạt động</p>
                    <p className="text-gray-500">Xe buýt chưa bắt đầu chuyến đi hôm nay</p>
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
                    <span>📚</span> Khối {currentChild.grade}
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-700 bg-white/60 backdrop-blur-sm rounded-xl p-3">
                  <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">Điểm đón:</span>
                    <p className="font-bold text-gray-900">{currentChild.stop_name || 'Chưa xác định'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700 bg-white/60 backdrop-blur-sm rounded-xl p-3">
                  <Bus className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">Tuyến:</span>
                    <p className="font-bold text-gray-900">{currentChild.route_name || 'Chưa xác định'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Driver Info */}
          {driver && <DriverInfoCard driver={driver} />}

          {/* Trip Status */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-2">
                <Clock className="w-5 h-5 text-white" />
              </div>
              Thông tin chuyến đi
            </h3>
            {busLocation?.has_active_trip ? (
              <div className="space-y-3 text-sm">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Trạng thái:</span>
                    <span className="font-bold text-green-700 flex items-center gap-1">
                      <span>✅</span>
                      {busLocation.trip_status === 'waiting' ? 'Đang chờ đón' :
                       busLocation.trip_status === 'onboard' ? 'Đã lên xe' :
                       busLocation.trip_status === 'dropped' ? 'Đã đến trường' : 'Đang di chuyển'}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-700 flex items-center gap-1">
                      <span>🚌</span> Xe buýt:
                    </span>
                    <span className="font-bold text-gray-900">{busLocation.bus_plate}</span>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                  <div className="flex justify-between">
                    <span className="text-gray-700 flex items-center gap-1">
                      <span>⏰</span> Giờ khởi hành:
                    </span>
                    <span className="font-bold text-gray-900">
                      {busLocation.start_time || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                  <div className="flex justify-between">
                    <span className="text-gray-700 flex items-center gap-1">
                      <span>👥</span> Học sinh trên xe:
                    </span>
                    <span className="font-bold text-purple-900">
                      {busLocation.students_onboard || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-4 mb-3">
                  <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto" />
                </div>
                <p className="text-gray-600 font-medium">Không có chuyến đi nào đang hoạt động</p>
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
