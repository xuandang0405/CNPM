import React from 'react'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'

export default function StudentCard({ student, onPicked, onDropped }){
  // Updated to work with new database structure
  const studentName = student.student?.name || student.name
  const stopName = student.stop?.name || student.address
  const stopLat = student.stop?.lat || student.lat
  const stopLng = student.stop?.lng || student.lng
  const tripStatus = student.trip_status || student.status
  const tripId = student.trip_id || student.id
  const parentPhone = student.parent?.phone || student.phone

  const mapsLink = stopLat && stopLng
    ? `https://www.google.com/maps/dir/?api=1&destination=${stopLat},${stopLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stopName || '')}`

  const { lang } = useUserStore()

  // Status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'onboard': return 'bg-green-500 text-white'
      case 'dropped': return 'bg-gray-500 text-white'
      case 'absent': return 'bg-red-500 text-white'
      default: return 'bg-yellow-500 text-white'
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'onboard': return t(lang,'onboard') || 'Đã lên xe'
      case 'dropped': return t(lang,'dropped') || 'Đã xuống xe'
      case 'absent': return t(lang,'absent') || 'Vắng mặt'
      default: return t(lang,'waiting') || 'Chờ đón'
    }
  }

  return (
    <div className="p-3 bg-white rounded shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{studentName}</div>
          <div className="text-sm text-gray-600">{stopName}</div>
          {student.student?.grade && (
            <div className="text-xs text-gray-500">{student.student.grade}</div>
          )}
          {parentPhone && (
            <div className="text-xs text-blue-600">{parentPhone}</div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tripStatus)}`}>
            {getStatusText(tripStatus)}
          </span>
          
          {/* Navigation Button */}
          {stopLat && stopLng && (
            <a 
              className="px-2 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors" 
              target="_blank" 
              rel="noreferrer" 
              href={mapsLink} 
              title={t(lang,'navigate') || 'Dẫn đường'}
            >
              📍
            </a>
          )}
          
          {/* Action Buttons */}
          {tripStatus === 'waiting' && (
            <button 
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" 
              onClick={() => onPicked && onPicked(tripId, 'onboard')}
            >
              {t(lang,'picked') || 'Đã đón'}
            </button>
          )}
          
          {tripStatus === 'onboard' && (
            <button 
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors" 
              onClick={() => onDropped && onDropped(tripId, 'dropped')}
            >
              {t(lang,'dropped') || 'Đã trả'}
            </button>
          )}
          
          {(tripStatus === 'waiting' || tripStatus === 'onboard') && (
            <button 
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors" 
              onClick={() => onDropped && onDropped(tripId, 'absent')}
            >
              {t(lang,'absent') || 'Vắng'}
            </button>
          )}
        </div>
      </div>

      {/* Additional Info */}
      {student.notes && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
          <strong>Ghi chú:</strong> {student.notes}
        </div>
      )}
      
      {student.picked_at && (
        <div className="mt-1 text-xs text-gray-500">
          Đã đón lúc: {new Date(student.picked_at).toLocaleTimeString('vi-VN')}
        </div>
      )}
      
      {student.dropped_at && (
        <div className="mt-1 text-xs text-gray-500">
          Đã trả lúc: {new Date(student.dropped_at).toLocaleTimeString('vi-VN')}
        </div>
      )}
    </div>
  )
}
