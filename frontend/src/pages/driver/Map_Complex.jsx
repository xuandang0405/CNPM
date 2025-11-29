import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Users, Clock, AlertTriangle, Phone, Route, Crosshair, Play, Pause } from 'lucide-react';
import Button from '../../components/common/Button';
import { tripsAPI } from '../../api/trips';

const DriverMap = () => {
  // States
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  
  const watchId = useRef(null);

  // Load students data
  useEffect(() => {
    loadStudents();
    getCurrentLocation();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      // Fallback data for testing
      setStudents([
        { id: 1, name: 'Nguyễn Văn A', grade: 'Lớp 8A', stop_name: 'Trạm số 1', pickup_time: '07:00', lat: 10.825, lng: 106.630, status: 'waiting' },
        { id: 2, name: 'Trần Thị B', grade: 'Lớp 8B', stop_name: 'Trạm số 2', pickup_time: '07:05', lat: 10.820, lng: 106.635, status: 'onboard' },
        { id: 3, name: 'Lê Văn C', grade: 'Lớp 7A', stop_name: 'Trạm số 3', pickup_time: '07:10', lat: 10.815, lng: 106.625, status: 'waiting' }
      ]);
    } catch (error) {
      console.error('Error loading students:', error);
      setAlert({ type: 'error', message: 'Không thể tải danh sách học sinh' });
    } finally {
      setLoading(false);
    }
  };

  // GPS Functions
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
        setAlert({ type: 'success', message: `Đã lấy vị trí: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` });
      },
      (error) => {
        console.error('GPS Error:', error);
        // Set default location (Ho Chi Minh City)
        setCurrentLocation({
          lat: 10.8231,
          lng: 106.6297,
          accuracy: 100,
          timestamp: new Date()
        });
        setAlert({ type: 'info', message: 'Sử dụng vị trí mặc định (TP.HCM)' });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setAlert({ type: 'error', message: 'Trình duyệt không hỗ trợ GPS' });
      return;
    }

    setIsTracking(true);
    
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: new Date()
        };
        
        setCurrentLocation(location);
        setAlert({ type: 'success', message: `GPS cập nhật: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` });
      },
      (error) => {
        console.error('GPS Error:', error);
        setAlert({ type: 'error', message: `Lỗi GPS: ${error.message}` });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      }
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setAlert({ type: 'info', message: 'Đã dừng theo dõi vị trí!' });
  };

  // Emergency Functions
  const handleEmergencyAlert = () => {
    setAlert({ type: 'warning', message: 'Đã gửi cảnh báo khẩn cấp!' });
  };

  const callEmergency = () => {
    window.location.href = 'tel:113';
  };

  // Utility Functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500';
      case 'onboard': return 'bg-blue-500'; 
      case 'dropped': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'waiting': return 'Chờ đón';
      case 'onboard': return 'Trên xe';
      case 'dropped': return 'Đã trả';
      default: return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Đang tải bản đồ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <MapPin className="h-6 w-6 mr-3 text-blue-600" />
              Bản đồ điều hướng
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              GPS: {isTracking ? 'Đang theo dõi' : 'Tạm dừng'} • {students.length} học sinh
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {currentLocation && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>Lat: {currentLocation.lat.toFixed(6)}</div>
                <div>Lng: {currentLocation.lng.toFixed(6)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map Container */}
        <div className="flex-1 relative">
          <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border-4 border-gray-200 dark:border-gray-600">
            {/* Simple Visual Map */}
            <div className="h-full w-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 relative overflow-hidden">
              {/* Background Grid */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Map Header */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Bản đồ Navigation (Demo)</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className={`h-2 w-2 rounded-full mr-2 ${isTracking ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`}></div>
                    {isTracking ? 'Đang theo dõi' : 'Tạm dừng'}
                  </div>
                </div>
              </div>

              {/* Map Content */}
              <div className="h-full flex items-center justify-center pt-16">
                <div className="text-center">
                  {/* Driver Icon */}
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 text-4xl ${
                    isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  } text-white shadow-lg`}>
                    🚌
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Vị trí xe bus
                  </h3>
                  
                  {currentLocation && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg mb-6 max-w-sm mx-auto">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <p><strong>Vĩ độ:</strong> {currentLocation.lat.toFixed(6)}</p>
                        <p><strong>Kinh độ:</strong> {currentLocation.lng.toFixed(6)}</p>
                        <p><strong>Độ chính xác:</strong> ±{currentLocation.accuracy}m</p>
                        <p className={`mt-2 font-medium ${isTracking ? 'text-green-600' : 'text-gray-500'}`}>
                          {isTracking ? '🟢 GPS đang hoạt động' : '🔴 GPS tạm dừng'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Students Preview */}
                  {students.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg max-w-md mx-auto">
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                        <Users className="h-4 w-4 inline mr-2" />
                        Học sinh trên tuyến ({students.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {students.slice(0, 4).map(student => (
                          <div key={student.id} className="flex items-center space-x-2">
                            <span className={`w-3 h-3 rounded-full ${getStatusColor(student.status)}`}></span>
                            <span className="text-gray-700 dark:text-gray-300 truncate">{student.name}</span>
                          </div>
                        ))}
                        {students.length > 4 && (
                          <div className="text-gray-500 dark:text-gray-400 text-center col-span-2">
                            +{students.length - 4} học sinh khác
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Controls */}
              <div className="absolute bottom-6 left-6 flex flex-col space-y-4 z-10">
                <button
                  onClick={isTracking ? stopTracking : startTracking}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    isTracking 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <div className="flex items-center">
                    {isTracking ? (
                      <>
                        <Pause className="h-5 w-5 mr-2" />
                        Dừng theo dõi
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Bắt đầu theo dõi
                      </>
                    )}
                  </div>
                </button>

                <button
                  onClick={getCurrentLocation}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center">
                    <Crosshair className="h-5 w-5 mr-2" />
                    Lấy vị trí
                  </div>
                </button>

                <button
                  onClick={handleEmergencyAlert}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Khẩn cấp
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Panel */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-600 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <h3 className="text-lg font-bold flex items-center">
              <Navigation className="h-5 w-5 mr-2" />
              Điều hướng
            </h3>
            <p className="text-sm opacity-90 mt-1">
              Tuyến đường & học sinh
            </p>
          </div>

          {/* Students List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Danh sách học sinh ({students.length})
              </h4>
              {students.map((student) => (
                <div key={student.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{student.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{student.grade}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(student.status)}`}>
                      {getStatusText(student.status)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <MapPin className="h-4 w-4 mr-1" />
                      {student.stop_name}
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-1" />
                      {student.pickup_time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Hành động nhanh</h4>
            <div className="space-y-2">
              <button
                onClick={handleEmergencyAlert}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
              >
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Báo cáo khẩn cấp
              </button>
              <button
                onClick={callEmergency}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <Phone className="h-4 w-4 inline mr-2" />
                Gọi khẩn cấp (113)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Message */}
      {alert && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          alert.type === 'error' 
            ? 'bg-red-500 text-white' 
            : alert.type === 'warning'
            ? 'bg-yellow-500 text-white'
            : alert.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span>{alert.message}</span>
            <button 
              onClick={() => setAlert(null)} 
              className="ml-4 text-white hover:text-gray-200 font-bold text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverMap;