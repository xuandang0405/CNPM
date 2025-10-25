import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertTriangle, Play, Pause, Users } from 'lucide-react';

const SimpleDriverMap = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [alert, setAlert] = useState(null);

  // Auto-hide alerts after 3 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setAlert({ type: 'error', message: 'Trình duyệt không hỗ trợ GPS' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };
        setCurrentLocation(location);
        setAlert({ type: 'success', message: 'Đã lấy vị trí thành công!' });
      },
      (error) => {
        // Fallback to Ho Chi Minh City coordinates
        setCurrentLocation({
          lat: 10.8231,
          lng: 106.6297,
          accuracy: 100,
          timestamp: new Date()
        });
        setAlert({ type: 'info', message: 'Sử dụng vị trí mặc định (TP.HCM)' });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    setAlert({ 
      type: 'info', 
      message: !isTracking ? 'Bắt đầu theo dõi GPS' : 'Dừng theo dõi GPS' 
    });
  };

  const sendEmergencyAlert = () => {
    setAlert({ type: 'warning', message: 'Đã gửi cảnh báo khẩn cấp!' });
  };

  // Initialize location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <MapPin className="h-6 w-6 mr-3 text-blue-600" />
              Bản đồ Driver
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Trạng thái: {isTracking ? '🟢 Đang theo dõi' : '🔴 Tạm dừng'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map Display */}
        <div className="flex-1 relative p-4">
          <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border-4 border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Map Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Navigation className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Smart School Bus Map</span>
                </div>
                <div className={`h-3 w-3 rounded-full ${isTracking ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`}></div>
              </div>
            </div>

            {/* Map Content */}
            <div className="h-full bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 flex items-center justify-center relative">
              {/* Background Grid */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Central Content */}
              <div className="relative z-10 text-center">
                {/* Bus Icon */}
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 text-4xl shadow-xl ${
                  isTracking ? 'bg-green-500 animate-bounce' : 'bg-gray-400'
                } text-white`}>
                  🚌
                </div>

                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  Xe Buýt Trường Học
                </h3>

                {/* Location Info */}
                {currentLocation && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6 max-w-md mx-auto">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-3">📍 Vị trí hiện tại</h4>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex justify-between">
                        <span className="font-medium">Vĩ độ:</span>
                        <span className="font-mono">{currentLocation.lat.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Kinh độ:</span>
                        <span className="font-mono">{currentLocation.lng.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Độ chính xác:</span>
                        <span>±{currentLocation.accuracy}m</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className={`text-sm font-medium ${isTracking ? 'text-green-600' : 'text-gray-500'}`}>
                          {isTracking ? '🟢 GPS đang hoạt động' : '⏸️ GPS tạm dừng'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Học sinh</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                    <div className="text-2xl font-bold text-green-600">5</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Trạm dừng</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                    <div className="text-2xl font-bold text-orange-600">2.5</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">km còn lại</div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="absolute bottom-6 left-6 flex flex-col space-y-3">
                <button
                  onClick={toggleTracking}
                  className={`px-4 py-3 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 ${
                    isTracking
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <div className="flex items-center">
                    {isTracking ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {isTracking ? 'Dừng' : 'Bắt đầu'}
                  </div>
                </button>

                <button
                  onClick={getCurrentLocation}
                  className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  📍 Vị trí
                </button>

                <button
                  onClick={sendEmergencyAlert}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  <AlertTriangle className="h-4 w-4 mr-2 inline" />
                  SOS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-600">
          {/* Sidebar Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <h3 className="text-lg font-bold flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Thông tin chuyến đi
            </h3>
            <p className="text-sm opacity-90">Tuyến buýt trường học</p>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">📋 Lịch trình hôm nay</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Giờ xuất phát:</span>
                  <span className="font-medium">07:00 AM</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng học sinh:</span>
                  <span className="font-medium">12 học sinh</span>
                </div>
                <div className="flex justify-between">
                  <span>Trạm đã qua:</span>
                  <span className="font-medium text-green-600">3/5 trạm</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">🎯 Trạm tiếp theo</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium">Trường THCS An Phú</p>
                <p>📍 123 Đường ABC, Quận 1</p>
                <p>⏱️ Dự kiến: 07:15 AM</p>
                <p className="text-blue-600 dark:text-blue-400 mt-2">🚶 3 học sinh chờ đón</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">⚡ Trạng thái hệ thống</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>GPS:</span>
                  <span className={isTracking ? 'text-green-600' : 'text-gray-500'}>
                    {isTracking ? '🟢 Hoạt động' : '🔴 Tạm dừng'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Kết nối:</span>
                  <span className="text-green-600">🟢 Ổn định</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pin:</span>
                  <span className="text-green-600">🔋 85%</span>
                </div>
              </div>
            </div>

            <button
              onClick={sendEmergencyAlert}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg"
            >
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Báo cáo khẩn cấp
            </button>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {alert && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl z-50 transform transition-all duration-300 ${
          alert.type === 'error' ? 'bg-red-500 text-white' :
          alert.type === 'warning' ? 'bg-yellow-500 text-white' :
          alert.type === 'success' ? 'bg-green-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              className="ml-3 text-white hover:text-gray-200 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleDriverMap;