import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertTriangle, Play, Pause, Users, Crosshair, Plus, Minus, Layers } from 'lucide-react';

const DriverMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [alert, setAlert] = useState(null);
  const [zoom, setZoom] = useState(16);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState('street');
  const markersRef = useRef([]);
  const watchIdRef = useRef(null);

  // Auto-hide alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        // Import Leaflet dynamically
        const L = await import('leaflet');
        
        // Import CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);

        // Fix marker icons
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (!mapRef.current || mapInstanceRef.current) return;

        // Create map
        const map = L.map(mapRef.current, {
          center: [10.8231, 106.6297],
          zoom: 16,
          zoomControl: false,
          attributionControl: false
        });

        // Add base layer
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;
        setMapLoaded(true);
        getCurrentLocation();

      } catch (error) {
        console.error('Error initializing map:', error);
        setAlert({ type: 'error', message: 'Không thể tải bản đồ' });
        setMapLoaded(false);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      const defaultLocation = { lat: 10.8231, lng: 106.6297, accuracy: 100 };
      setCurrentLocation(defaultLocation);
      updateMapMarkers(defaultLocation);
      setAlert({ type: 'info', message: 'Sử dụng vị trí mặc định (TP.HCM)' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 100,
          timestamp: new Date()
        };
        setCurrentLocation(location);
        updateMapMarkers(location);
        setAlert({ type: 'success', message: 'Đã cập nhật vị trí thành công!' });
      },
      (error) => {
        console.error('GPS Error:', error);
        const defaultLocation = { lat: 10.8231, lng: 106.6297, accuracy: 100 };
        setCurrentLocation(defaultLocation);
        updateMapMarkers(defaultLocation);
        setAlert({ type: 'warning', message: 'Không thể lấy GPS, sử dụng vị trí mặc định' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setAlert({ type: 'error', message: 'Thiết bị không hỗ trợ GPS' });
      return;
    }

    setIsTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 100,
          timestamp: new Date()
        };
        setCurrentLocation(location);
        updateMapMarkers(location);
      },
      (error) => {
        console.error('GPS tracking error:', error);
        setAlert({ type: 'error', message: 'Lỗi GPS tracking' });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
    );
    setAlert({ type: 'success', message: 'Bắt đầu theo dõi GPS' });
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setAlert({ type: 'info', message: 'Đã dừng theo dõi GPS' });
  };

  const updateMapMarkers = async (location) => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    try {
      const L = await import('leaflet');

      // Clear existing markers
      markersRef.current.forEach(marker => {
        mapInstanceRef.current.removeLayer(marker);
      });
      markersRef.current = [];

      // Driver marker
      const driverIcon = L.divIcon({
        html: `
          <div class="relative">
            <div class="w-12 h-12 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xl animate-pulse">
              🚌
            </div>
            <div class="absolute -top-1 -right-1 w-4 h-4 ${isTracking ? 'bg-green-500' : 'bg-red-500'} rounded-full border-2 border-white"></div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        className: 'driver-marker'
      });

      const driverMarker = L.marker([location.lat, location.lng], {
        icon: driverIcon
      }).addTo(mapInstanceRef.current);

      driverMarker.bindPopup(`
        <div class="p-3 font-sans">
          <h3 class="font-bold text-lg text-gray-800 mb-2">🚌 Xe Buýt Trường Học</h3>
          <div class="space-y-1 text-sm text-gray-600">
            <div><strong>Vĩ độ:</strong> ${location.lat.toFixed(6)}</div>
            <div><strong>Kinh độ:</strong> ${location.lng.toFixed(6)}</div>
            <div><strong>Độ chính xác:</strong> ±${location.accuracy}m</div>
            <div class="mt-2 px-2 py-1 rounded ${isTracking ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
              ${isTracking ? '🟢 Đang theo dõi GPS' : '🔴 GPS tạm dừng'}
            </div>
          </div>
        </div>
      `);

      markersRef.current.push(driverMarker);

      // Sample student markers
      const students = [
        { name: 'Nguyễn Văn A', lat: location.lat + 0.001, lng: location.lng + 0.0015, status: 'waiting' },
        { name: 'Trần Thị B', lat: location.lat - 0.0008, lng: location.lng + 0.001, status: 'picked' },
        { name: 'Lê Văn C', lat: location.lat + 0.0005, lng: location.lng - 0.001, status: 'waiting' },
      ];

      students.forEach(student => {
        const studentIcon = L.divIcon({
          html: `
            <div class="w-8 h-8 ${student.status === 'waiting' ? 'bg-orange-500' : 'bg-green-500'} rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white text-sm">
              ${student.status === 'waiting' ? '👤' : '✅'}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          className: 'student-marker'
        });

        const studentMarker = L.marker([student.lat, student.lng], {
          icon: studentIcon
        }).addTo(mapInstanceRef.current);

        studentMarker.bindPopup(`
          <div class="p-3 font-sans">
            <h3 class="font-bold text-lg text-gray-800 mb-2">👤 ${student.name}</h3>
            <div class="text-sm text-gray-600">
              <div>Trạng thái: <span class="${student.status === 'waiting' ? 'text-orange-600' : 'text-green-600'} font-bold">
                ${student.status === 'waiting' ? 'Chờ đón' : 'Đã đón'}
              </span></div>
            </div>
          </div>
        `);

        markersRef.current.push(studentMarker);
      });

      // Center map
      mapInstanceRef.current.setView([location.lat, location.lng], zoom);

    } catch (error) {
      console.error('Error updating markers:', error);
    }
  };

  const zoomIn = () => {
    if (mapInstanceRef.current && zoom < 19) {
      const newZoom = zoom + 1;
      setZoom(newZoom);
      mapInstanceRef.current.setZoom(newZoom);
    }
  };

  const zoomOut = () => {
    if (mapInstanceRef.current && zoom > 1) {
      const newZoom = zoom - 1;
      setZoom(newZoom);
      mapInstanceRef.current.setZoom(newZoom);
    }
  };

  const centerOnLocation = () => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 17);
      setAlert({ type: 'success', message: 'Đã về vị trí hiện tại' });
    } else {
      getCurrentLocation();
    }
  };

  const toggleMapType = async () => {
    if (!mapInstanceRef.current) return;
    
    try {
      const L = await import('leaflet');
      
      // Remove all tile layers
      mapInstanceRef.current.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      if (mapType === 'street') {
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: 'Esri'
        }).addTo(mapInstanceRef.current);
        setMapType('satellite');
        setAlert({ type: 'info', message: 'Chuyển sang bản đồ vệ tinh' });
      } else {
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: 'OpenStreetMap'
        }).addTo(mapInstanceRef.current);
        setMapType('street');
        setAlert({ type: 'info', message: 'Chuyển sang bản đồ đường phố' });
      }
    } catch (error) {
      console.error('Error switching map type:', error);
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <MapPin className="h-6 w-6 mr-3 text-blue-600" />
              Smart School Bus Map
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              GPS: {isTracking ? '🟢 Hoạt động' : '🔴 Tạm dừng'} • 
              Zoom: {zoom}/19 • 
              Chế độ: {mapType === 'street' ? 'Đường phố' : 'Vệ tinh'}
            </p>
          </div>
          {currentLocation && (
            <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
              <div>📍 {currentLocation.lat.toFixed(6)}</div>
              <div>📍 {currentLocation.lng.toFixed(6)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map Container */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef} 
            className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-700"
          />

          {/* Loading Overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-90">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Đang tải Google-like Map...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Sử dụng Leaflet + OpenStreetMap</p>
              </div>
            </div>
          )}

          {/* Map Controls */}
          {mapLoaded && (
            <>
              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={zoomIn}
                  disabled={zoom >= 19}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={zoomOut}
                  disabled={zoom <= 1}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Map Type Control */}
              <div className="absolute top-4 right-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                <button
                  onClick={toggleMapType}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={`Chuyển sang ${mapType === 'street' ? 'vệ tinh' : 'đường phố'}`}
                >
                  <Layers className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* My Location Button */}
              <div className="absolute bottom-20 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                <button
                  onClick={centerOnLocation}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Về vị trí hiện tại"
                >
                  <Crosshair className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Control Buttons */}
              <div className="absolute bottom-4 left-4 flex flex-col space-y-3">
                <button
                  onClick={isTracking ? stopTracking : startTracking}
                  className={`px-4 py-3 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 ${
                    isTracking
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <div className="flex items-center">
                    {isTracking ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {isTracking ? 'Dừng GPS' : 'Bắt đầu GPS'}
                  </div>
                </button>

                <button
                  onClick={getCurrentLocation}
                  className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  📍 Cập nhật vị trí
                </button>

                <button
                  onClick={() => setAlert({ type: 'warning', message: '🚨 Đã gửi cảnh báo khẩn cấp!' })}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  <AlertTriangle className="h-4 w-4 mr-2 inline" />
                  SOS
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-600 flex flex-col">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h3 className="text-lg font-bold flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Thông tin GPS
            </h3>
            <p className="text-sm opacity-90">Real-time tracking system</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Location Info */}
            {currentLocation && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                  📍 Vị trí hiện tại
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Vĩ độ:</span>
                    <span className="font-mono font-medium">{currentLocation.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kinh độ:</span>
                    <span className="font-mono font-medium">{currentLocation.lng.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Độ chính xác:</span>
                    <span>±{currentLocation.accuracy}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian:</span>
                    <span>{currentLocation.timestamp?.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Map Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                🗺️ Thông tin bản đồ
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Mức zoom:</span>
                  <span className="font-medium">{zoom}/19</span>
                </div>
                <div className="flex justify-between">
                  <span>Loại bản đồ:</span>
                  <span className="font-medium">{mapType === 'street' ? 'Đường phố' : 'Vệ tinh'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trạng thái GPS:</span>
                  <span className={`font-medium ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                    {isTracking ? '🟢 Hoạt động' : '🔴 Tạm dừng'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bản đồ:</span>
                  <span className={`font-medium ${mapLoaded ? 'text-green-600' : 'text-yellow-600'}`}>
                    {mapLoaded ? '🟢 Đã tải' : '🟡 Đang tải'}
                  </span>
                </div>
              </div>
            </div>

            {/* Students Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                👥 Học sinh trên tuyến
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                    Chờ đón
                  </span>
                  <span className="font-bold text-orange-600">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Đã đón
                  </span>
                  <span className="font-bold text-green-600">1</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-300 dark:border-gray-600 pt-2">
                  <span className="flex items-center font-medium">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Tổng cộng
                  </span>
                  <span className="font-bold text-blue-600">3</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                onClick={() => setAlert({ type: 'warning', message: '📢 Đã gửi thông báo cho phụ huynh!' })}
                className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-lg"
              >
                📢 Thông báo phụ huynh
              </button>
              
              <button
                onClick={() => setAlert({ type: 'warning', message: '🚨 Đã kích hoạt cảnh báo khẩn cấp!' })}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg"
              >
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Báo cáo khẩn cấp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notifications */}
      {alert && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl z-[9999] transform transition-all duration-300 max-w-sm ${
          alert.type === 'error' ? 'bg-red-500 text-white' :
          alert.type === 'warning' ? 'bg-yellow-500 text-white' :
          alert.type === 'success' ? 'bg-green-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium pr-4">{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              className="text-white hover:text-gray-200 font-bold text-lg flex-shrink-0"
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