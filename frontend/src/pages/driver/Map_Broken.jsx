import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Users, Clock, AlertTriangle, Phone, Route, Crosshair, Play, Pause, Square } from 'lucide-react';
import OpenStreetMap from '../../components/mapping/OpenStreetMap';
import Button from '../../components/common/Button';
import { tripsAPI } from '../../api/trips';

// Simple fallback map component
const SimpleMap = ({ currentLocation, students, isTracking }) => {
  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Map content */}
      <div className="relative z-10 text-center">
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'} text-white text-3xl mb-4`}>
            🚌
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Bản đồ đơn giản</h3>
          <p className="text-gray-600 dark:text-gray-300">Đang sử dụng chế độ fallback</p>
        </div>
        
        {/* Location info */}
        {currentLocation && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg mb-4">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Vị trí hiện tại</h4>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>Lat: {currentLocation.lat.toFixed(6)}</p>
              <p>Lng: {currentLocation.lng.toFixed(6)}</p>
              <p className={`mt-2 ${isTracking ? 'text-green-600' : 'text-gray-500'}`}>
                {isTracking ? '🟢 Đang theo dõi' : '🔴 Tạm dừng'}
              </p>
            </div>
          </div>
        )}
        
        {/* Students info */}
        {students.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Học sinh trên tuyến</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {students.slice(0, 4).map(student => (
                <div key={student.id} className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${
                    student.status === 'waiting' ? 'bg-yellow-500' :
                    student.status === 'onboard' ? 'bg-blue-500' : 'bg-green-500'
                  }`}></span>
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
  );
};

const DriverMap = () => {
  // States
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [mapError, setMapError] = useState(false);
  
  const watchId = useRef(null);

  // Load students data
  useEffect(() => {
    loadStudents();
    startTracking(); // Auto start tracking
    
    // Test map loading after 3 seconds
    setTimeout(() => {
      if (loading) {
        setMapError(true);
        setAlert({ type: 'info', message: 'Đã chuyển sang chế độ bản đồ đơn giản' });
      }
    }, 3000);
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await tripsAPI.getMyStudents();
      
      if (response.success) {
        // Generate sample locations for students
        const studentsWithLocations = response.data.map((student, index) => ({
          ...student,
          lat: 10.8231 + (Math.random() - 0.5) * 0.02,
          lng: 106.6297 + (Math.random() - 0.5) * 0.02,
          status: ['waiting', 'onboard', 'dropped'][Math.floor(Math.random() * 3)]
        }));
        
        setStudents(studentsWithLocations);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setAlert({ type: 'error', message: 'Không thể tải danh sách học sinh' });
      
      // Fallback data for testing
      setStudents([
        { id: 1, name: 'Nguyễn Văn A', grade: 'Lớp 8A', stop_name: 'Trạm số 1', pickup_time: '07:00', lat: 10.825, lng: 106.630, status: 'waiting' },
        { id: 2, name: 'Trần Thị B', grade: 'Lớp 8B', stop_name: 'Trạm số 2', pickup_time: '07:05', lat: 10.820, lng: 106.635, status: 'onboard' },
        { id: 3, name: 'Lê Văn C', grade: 'Lớp 7A', stop_name: 'Trạm số 3', pickup_time: '07:10', lat: 10.815, lng: 106.625, status: 'waiting' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // GPS Tracking Functions
  const startTracking = () => {
    if (!navigator.geolocation) {
      setAlert({ type: 'error', message: 'Trình duyệt không hỗ trợ GPS' });
      return;
    }

    setIsTracking(true);
    console.log('Starting GPS tracking...');
    
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
        
        console.log('GPS Update:', location);
        setCurrentLocation(location);
        sendLocationUpdate(location);
        
        // Update location history
        setLocationHistory(prev => [...prev.slice(-19), location]);
      },
      (error) => {
        console.error('GPS Error:', error);
        setAlert({ 
          type: 'error', 
          message: `Lỗi GPS: ${error.message}. Đang thử lại...` 
        });
        
        setTimeout(() => {
          if (isTracking) {
            startTracking();
          }
        }, 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      }
    );

    setAlert({ type: 'success', message: 'Đang theo dõi vị trí GPS liên tục!' });
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setAlert({ type: 'info', message: 'Đã dừng theo dõi vị trí!' });
  };

  const sendLocationUpdate = async (location) => {
    try {
      await tripsAPI.updateDriverLocation({
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
        timestamp: location.timestamp
      });
    } catch (error) {
      console.error('Error sending location:', error);
    }
  };

  // Map Functions
  const getMapMarkers = () => {
    const markers = [];

    // Add driver location
    if (currentLocation) {
      markers.push({
        position: { lat: currentLocation.lat, lng: currentLocation.lng },
        title: `🚌 Xe bus của bạn`,
        type: 'driver',
        status: isTracking ? 'tracking' : 'stopped'
      });
    }

    // Add student locations
    students.forEach((student) => {
      if (student.lat && student.lng) {
        markers.push({
          position: { lat: student.lat, lng: student.lng },
          title: `${student.name} (${student.grade})`,
          type: 'student',
          status: student.status,
          onClick: () => {
            setAlert({ 
              type: 'info', 
              message: `${student.name} - ${getStatusText(student.status)} tại ${student.stop_name}` 
            });
          }
        });
      }
    });

    return markers;
  };

  // Lấy destinations cho routing
  const getRouteDestinations = () => {
    const destinations = [];
    
    // Thêm vị trí học sinh chưa được đón
    students.forEach((student) => {
      if (student.lat && student.lng && student.status === 'waiting') {
        destinations.push({
          lat: student.lat,
          lng: student.lng,
          name: student.name,
          address: student.stop_name || student.address
        });
      }
    });

    // Thêm trường học làm điểm cuối
    if (destinations.length > 0) {
      destinations.push({
        lat: 10.8231,
        lng: 106.6297,
        name: 'Trường THCS',
        address: 'Điểm đến cuối cùng'
      });
    }

    return destinations;
  };

  // Emergency Functions
  const handleEmergencyAlert = async () => {
    try {
      await tripsAPI.sendEmergencyAlert({
        location: currentLocation,
        timestamp: new Date(),
        message: 'Báo cáo khẩn cấp từ tài xế'
      });
      setAlert({ type: 'success', message: 'Đã gửi cảnh báo khẩn cấp!' });
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      setAlert({ type: 'error', message: 'Không thể gửi cảnh báo khẩn cấp' });
    }
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
        {/* Map Container với khung cố định */}
        <div className="flex-1 relative">
            <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border-4 border-gray-200 dark:border-gray-600">
              {mapError ? (
                <SimpleMap 
                  currentLocation={currentLocation}
                  students={students}
                  isTracking={isTracking}
                />
              ) : (
                <OpenStreetMap
                  center={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : { lat: 10.8231, lng: 106.6297 }}
                  zoom={16}
                  markers={getMapMarkers()}
                  showRouting={students.length > 0}
                  routeDestinations={getRouteDestinations()}
                  onLocationUpdate={(location) => {
                    if (location.type === 'route_found') {
                      setRouteInfo({
                        distance: location.distance,
                        time: location.time
                      });
                      setAlert({ 
                        type: 'success', 
                        message: `Tuyến đường: ${(location.distance / 1000).toFixed(1)}km - ${Math.round(location.time / 60)} phút` 
                      });
                    } else if (location.type === 'route_error') {
                      setMapError(true);
                      setAlert({ type: 'warning', message: 'Chuyển sang chế độ đơn giản' });
                    } else {
                      setCurrentLocation({
                        ...location,
                        accuracy: 10,
                        timestamp: new Date()
                      });
                      sendLocationUpdate(location);
                      setAlert({ type: 'success', message: `Vị trí: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` });
                    }
                  }}
                  autoCenter={isTracking}
                  className="h-full w-full"
                />
              )}            {/* Map Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 z-[1000]">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Bản đồ Navigation</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className={`h-2 w-2 rounded-full mr-2 ${isTracking ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`}></div>
                  {isTracking ? 'Đang theo dõi' : 'Tạm dừng'}
                </div>
              </div>
            </div>

            {/* Floating Controls */}
            <div className="absolute bottom-6 left-6 flex flex-col space-y-4 z-[1000]">
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
                onClick={handleEmergencyAlert}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg animate-pulse"
              >
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Khẩn cấp
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Panel */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-600 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <h3 className="text-lg font-bold flex items-center">
              <Navigation className="h-5 w-5 mr-2" />
              Hướng dẫn đường đi
            </h3>
            <p className="text-sm opacity-90 mt-1">
              {getRouteDestinations().length > 0 
                ? `${getRouteDestinations().length} điểm đến` 
                : 'Chưa có lộ trình'}
            </p>
          </div>

          {/* Route List */}
          <div className="flex-1 overflow-y-auto">
            {getRouteDestinations().length > 0 ? (
              <div className="p-4 space-y-3">
                {getRouteDestinations().map((dest, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{dest.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{dest.address}</p>
                        </div>
                      </div>
                      <MapPin className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có học sinh nào cần đón</p>
                <p className="text-sm mt-2">Lộ trình sẽ hiện khi có học sinh chờ đón</p>
              </div>
            )}
          </div>

          {/* Route Info */}
          {currentLocation && getRouteDestinations().length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-gray-900 dark:text-white">Tổng cự li</p>
                  <p className="text-blue-600 dark:text-blue-400">
                    {routeInfo ? `${(routeInfo.distance / 1000).toFixed(1)}km` : 'Đang tính...'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 dark:text-white">Thời gian</p>
                  <p className="text-green-600 dark:text-green-400">
                    {routeInfo ? `${Math.round(routeInfo.time / 60)} phút` : 'Đang tính...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Student List */}
          <div className="border-t border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto">
            <div className="p-3 bg-gray-100 dark:bg-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Học sinh trên tuyến</h4>
            </div>
            <div className="p-3 space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{student.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.stop_name}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(student.status)}`}>
                    {getStatusText(student.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
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
            <button onClick={() => setAlert(null)} className="ml-4 text-white hover:text-gray-200">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverMap;