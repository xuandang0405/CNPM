import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  Users, 
  Clock, 
  AlertTriangle, 
  RotateCcw,
  Crosshair,
  Route,
  Bus,
  Phone,
  Square
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { AlertBanner } from '../../components/common/AlertBanner';
import { updateDriverLocation, sendEmergencyAlert } from '../../api/trips';
import OpenStreetMap from '../../components/mapping/OpenStreetMap';

export default function DriverMap() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [students, setStudents] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [alert, setAlert] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);
  const mapRef = useRef(null);
  const watchId = useRef(null);

  // Mock data for students on route
  const mockStudents = [
    {
      id: '1',
      name: 'Nguyễn Văn An',
      grade: '6A',
      stop_name: 'Bến xe Quận 1',
      status: 'waiting',
      lat: 10.7769,
      lng: 106.7009,
      pickup_time: '07:15'
    },
    {
      id: '2', 
      name: 'Trần Thị Bình',
      grade: '7B',
      stop_name: 'Chợ Bến Thành',
      status: 'onboard',
      lat: 10.7724,
      lng: 106.6979,
      pickup_time: '07:25'
    },
    {
      id: '3',
      name: 'Lê Minh Cường',
      grade: '8C', 
      stop_name: 'Trường THCS ABC',
      status: 'waiting',
      lat: 10.7831,
      lng: 106.6958,
      pickup_time: '07:35'
    }
  ];

  useEffect(() => {
    setStudents(mockStudents);
    getCurrentLocation();
    
    // Auto start tracking when component mounts
    const timer = setTimeout(() => {
      startTracking();
    }, 2000);
    
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      clearTimeout(timer);
    };
  }, []);

  // Send location update to backend
  const sendLocationUpdate = async (location) => {
    try {
      await updateDriverLocation(location.lat, location.lng, location.accuracy);
      setLocationHistory(prev => [...prev.slice(-19), location]); // Keep last 20 locations
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  // Send emergency alert
  const handleEmergencyAlert = async () => {
    try {
      await sendEmergencyAlert('Emergency: Driver needs immediate assistance!');
      setAlert({ type: 'success', message: 'Cảnh báo khẩn cấp đã được gửi!' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Không thể gửi cảnh báo khẩn cấp!' });
    }
  };

  // Call emergency contact
  const callEmergency = () => {
    const emergencyNumber = '113'; // Vietnam emergency number
    if (confirm(`Gọi số khẩn cấp ${emergencyNumber}?`)) {
      window.location.href = `tel:${emergencyNumber}`;
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setAlert({ type: 'error', message: 'Trình duyệt không hỗ trợ định vị GPS!' });
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
        setMapError(false);
        
        // Simulate sending location to backend
        sendLocationUpdate(location);
      },
      (error) => {
        setAlert({ 
          type: 'error', 
          message: `Không thể lấy vị trí: ${error.message}` 
        });
        setMapError(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setAlert({ type: 'error', message: 'Trình duyệt không hỗ trợ định vị GPS!' });
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
        
        // Try to restart tracking after error
        setTimeout(() => {
          if (isTracking) {
            startTracking();
          }
        }, 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000 // Cache for 2 seconds
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

  // Create markers for the map
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
    students.forEach((student, index) => {
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

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="h-6 w-6 text-blue-600 mr-2" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bản đồ theo dõi
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentLocation ? (
                  `Vị trí hiện tại: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`
                ) : (
                  'Đang lấy vị trí...'
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={callEmergency}
              className="bg-red-600 hover:bg-red-700"
              size="sm"
            >
              <Phone className="w-4 h-4 mr-1" />
              113
            </Button>
            
            {!isTracking ? (
              <Button
                onClick={startTracking}
                className="bg-green-600 hover:bg-green-700"
                disabled={!currentLocation}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Bắt đầu
              </Button>
            ) : (
              <Button
                onClick={stopTracking}
                className="bg-red-600 hover:bg-red-700"
              >
                <Square className="w-4 h-4 mr-2" />
                Dừng
              </Button>
            )}
            
            <Button
              onClick={getCurrentLocation}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {alert && (
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            className="mt-4"
          />
        )}
      </div>

      <div className="flex-1 flex">
        {/* Map Area */}
        <div className="flex-1 relative">
          {mapError ? (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Không thể tải bản đồ
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Vui lòng kiểm tra kết nối internet và quyền truy cập vị trí
                </p>
                <Button onClick={getCurrentLocation}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Thử lại
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex">
              {/* Map Container với khung cố định */}
              <div className="flex-1 relative">
                <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border-4 border-gray-200 dark:border-gray-600">
                  <OpenStreetMap
                    center={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : { lat: 10.8231, lng: 106.6297 }}
                    zoom={16}
                    markers={getMapMarkers()}
                    showRouting={students.length > 0}
                    routeDestinations={getRouteDestinations()}
                    onLocationUpdate={(location) => {
                      if (location.type === 'route_found') {
                        setAlert({ 
                          type: 'success', 
                          message: `Tuyến đường: ${(location.distance / 1000).toFixed(1)}km - ${Math.round(location.time / 60)} phút` 
                        });
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

                  {/* Map Header */}
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
                </div>

              {/* Floating Status Panel */}
              {currentLocation && (
                <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000] min-w-[200px]">
                  <div className="flex items-center mb-2">
                    <div className={`h-3 w-3 rounded-full mr-2 ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {isTracking ? 'Đang theo dõi GPS' : 'GPS tạm dừng'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <div>Vĩ độ: {currentLocation.lat?.toFixed(6)}</div>
                    <div>Kinh độ: {currentLocation.lng?.toFixed(6)}</div>
                    <div>Độ chính xác: ±{currentLocation.accuracy?.toFixed(0)}m</div>
                    <div>Cập nhật: {currentLocation.timestamp?.toLocaleTimeString('vi-VN')}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Học sinh:</span>
                      <span className="font-medium">{students.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Control Buttons */}
              <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-[1000]">
                <Button
                  onClick={isTracking ? stopTracking : startTracking}
                  className={`rounded-full w-14 h-14 shadow-lg ${isTracking 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                  }`}
                  title={isTracking ? 'Dừng theo dõi' : 'Bắt đầu theo dõi'}
                >
                  {isTracking ? (
                    <Square className="w-6 h-6" />
                  ) : (
                    <Navigation className="w-6 h-6" />
                  )}
                </Button>
                
                <Button
                  onClick={getCurrentLocation}
                  className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
                  title="Lấy vị trí hiện tại"
                >
                  <Crosshair className="w-6 h-6" />
                </Button>

                <Button
                  onClick={handleEmergencyAlert}
                  className="rounded-full w-14 h-14 bg-orange-600 hover:bg-orange-700 shadow-lg"
                  title="Báo cáo khẩn cấp"
                >
                  <AlertTriangle className="w-6 h-6" />
                </Button>
              </div>
            </div>
          )}

          {/* SimpleMap handles all UI now */}
          {false && (
            <div className="absolute bottom-4 left-4 space-y-2">
              <Button
                onClick={getCurrentLocation}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 shadow-lg"
                size="sm"
              >
                <Crosshair className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Student List Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Học sinh trên tuyến
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {students.length} học sinh
            </p>
          </div>

          <div className="p-4 space-y-3">
            {students.map((student) => (
              <div key={student.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {student.grade}
                    </p>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(student.status)}`}>
                    {getStatusText(student.status)}
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {student.stop_name}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-1" />
                    {student.pickup_time}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Navigate to student location on map
                      setAlert({ 
                        type: 'info', 
                        message: `Đang điều hướng đến ${student.stop_name}` 
                      });
                    }}
                  >
                    <Route className="w-3 h-3 mr-1" />
                    Đến
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Hành động nhanh
            </h3>
            <div className="space-y-2">
              <Button
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                size="sm"
                onClick={handleEmergencyAlert}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Báo cáo khẩn cấp
              </Button>
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                size="sm"
                onClick={callEmergency}
              >
                <Phone className="w-4 h-4 mr-2" />
                Gọi khẩn cấp (113)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}