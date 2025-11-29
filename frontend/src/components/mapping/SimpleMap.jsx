import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Users, AlertTriangle } from 'lucide-react';
import { Button } from '../common/Button';

const SimpleMap = ({ 
  center = { lat: 10.8231, lng: 106.6297 }, 
  currentLocation,
  students = [],
  isTracking = false,
  onStartTracking,
  onStopTracking,
  onLocationUpdate
}) => {
  const [mapCenter, setMapCenter] = useState(center);
  const [zoom, setZoom] = useState(13);

  // Mock students if none provided
  const mockStudents = students.length > 0 ? students : [
    { id: 1, name: 'Nguyễn Văn An', lat: 10.8231, lng: 106.6297, status: 'waiting' },
    { id: 2, name: 'Trần Thị Bình', lat: 10.8241, lng: 106.6287, status: 'onboard' },
    { id: 3, name: 'Lê Minh Cường', lat: 10.8221, lng: 106.6307, status: 'waiting' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500';
      case 'onboard': return 'bg-blue-500';
      case 'dropped': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Convert to meters
  };

  return (
    <div className="h-full w-full bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
      {/* Map Grid Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Driver Position */}
      {currentLocation && (
        <div 
          className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{
            left: '50%',
            top: '40%'
          }}
        >
          <div className="relative">
            <div className="w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">🚌</span>
            </div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap">
              Xe bus
            </div>
          </div>
        </div>
      )}

      {/* Student Markers */}
      {mockStudents.map((student, index) => {
        const angle = (index * 60) + (Date.now() / 1000 % 360); // Rotating positions
        const radius = 80 + (index * 30);
        const x = 50 + Math.cos(angle * Math.PI / 180) * radius / 4;
        const y = 40 + Math.sin(angle * Math.PI / 180) * radius / 4;
        
        return (
          <div 
            key={student.id}
            className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${Math.max(10, Math.min(90, x))}%`,
              top: `${Math.max(10, Math.min(80, y))}%`
            }}
          >
            <div className="relative group cursor-pointer">
              <div className={`w-6 h-6 ${getStatusColor(student.status)} rounded-full border-2 border-white shadow-lg flex items-center justify-center`}>
                <span className="text-white text-xs">👤</span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                {student.name}
                <div className="text-xs opacity-75">
                  {student.status === 'waiting' ? 'Chờ đón' : 
                   student.status === 'onboard' ? 'Trên xe' : 'Đã trả'}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Status Panel */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-30 min-w-[200px]">
        <div className="flex items-center mb-3">
          <MapPin className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Bản đồ trực quan</h3>
        </div>
        
        {currentLocation ? (
          <div className="space-y-2">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {isTracking ? 'Đang theo dõi' : 'Tạm dừng'}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Vị trí: {currentLocation.lat?.toFixed(6)}, {currentLocation.lng?.toFixed(6)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Độ chính xác: ±{currentLocation.accuracy?.toFixed(0)}m
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Cập nhật: {currentLocation.timestamp?.toLocaleTimeString('vi-VN')}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có vị trí GPS
          </div>
        )}
        
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Học sinh: {mockStudents.length}
          </div>
          <div className="flex space-x-1">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
              <span className="text-xs">Chờ</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
              <span className="text-xs">Xe</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span className="text-xs">Xong</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-30">
        <Button
          onClick={isTracking ? onStopTracking : onStartTracking}
          className={`rounded-full w-14 h-14 ${isTracking 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isTracking ? (
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          ) : (
            <Navigation className="w-6 h-6" />
          )}
        </Button>
        
        <Button
          onClick={() => onLocationUpdate && onLocationUpdate(mapCenter)}
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700"
        >
          <MapPin className="w-6 h-6" />
        </Button>
      </div>

      {/* Click anywhere info */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-20 text-xs text-gray-600 dark:text-gray-400">
        💡 Click bản đồ để cập nhật vị trí
      </div>

      {/* Invisible clickable overlay */}
      <div 
        className="absolute inset-0 z-5 cursor-crosshair"
        onClick={(e) => {
          if (onLocationUpdate) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            
            // Convert screen coordinates to approximate lat/lng
            const lat = mapCenter.lat + (0.5 - y) * 0.01; // Rough conversion
            const lng = mapCenter.lng + (x - 0.5) * 0.01;
            
            onLocationUpdate({ lat, lng });
          }
        }}
      />
    </div>
  );
};

export default SimpleMap;