import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertTriangle, Play, Pause, Users, Crosshair, Plus, Minus, Layers, Route } from 'lucide-react';

const GoogleLikeMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [alert, setAlert] = useState(null);
  const [zoom, setZoom] = useState(16);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState('street'); // 'street', 'satellite'
  const markersRef = useRef([]);

  // Initialize Leaflet map
  useEffect(() => {
    let L;
    
    const initMap = async () => {
      try {
        // Dynamically import Leaflet
        L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        // Fix default markers
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        if (!mapRef.current || mapInstanceRef.current) return;

        // Create map with Google-like settings
        const map = L.map(mapRef.current, {
          center: [10.8231, 106.6297], // Ho Chi Minh City
          zoom: 16,
          zoomControl: false, // We'll add custom controls
          attributionControl: false
        });

        // Add tile layers
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: ''
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: ''
        });

        // Add default layer
        streetLayer.addTo(map);

        mapInstanceRef.current = map;
        setMapLoaded(true);

        // Get initial location
        getCurrentLocation();

      } catch (error) {
        console.error('Error loading map:', error);
        setAlert({ type: 'error', message: 'Không thể tải bản đồ' });
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Auto-hide alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 4000);
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
        
        if (mapInstanceRef.current && mapLoaded) {
          updateMapLocation(location);
        }
        
        setAlert({ type: 'success', message: `Đã lấy vị trí: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` });
      },
      (error) => {
        console.error('GPS Error:', error);
        // Fallback to Ho Chi Minh City
        const location = {
          lat: 10.8231,
          lng: 106.6297,
          accuracy: 100,
          timestamp: new Date()
        };
        setCurrentLocation(location);
        
        if (mapInstanceRef.current && mapLoaded) {
          updateMapLocation(location);
        }
        
        setAlert({ type: 'info', message: 'Sử dụng vị trí mặc định (TP.HCM)' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const updateMapLocation = async (location) => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    try {
      const L = await import('leaflet');

      // Clear existing markers
      markersRef.current.forEach(marker => {
        mapInstanceRef.current.removeLayer(marker);
      });
      markersRef.current = [];

      // Create custom driver icon
      const driverIcon = L.divIcon({
        html: `
          <div style="
            width: 40px; 
            height: 40px; 
            background: linear-gradient(45deg, #3B82F6, #1D4ED8); 
            border: 4px solid white; 
            border-radius: 50%; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            position: relative;
          ">
            🚌
            <div style="
              position: absolute;
              top: -2px;
              right: -2px;
              width: 12px;
              height: 12px;
              background: ${isTracking ? '#10B981' : '#EF4444'};
              border: 2px solid white;
              border-radius: 50%;
              ${isTracking ? 'animation: pulse 2s infinite;' : ''}
            "></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        className: 'driver-location-marker'
      });

      // Add driver marker
      const driverMarker = L.marker([location.lat, location.lng], {
        icon: driverIcon
      }).addTo(mapInstanceRef.current);

      driverMarker.bindPopup(`
        <div style="font-family: system-ui; padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #1F2937; font-weight: bold;">🚌 Xe Buýt Trường Học</h3>
          <div style="font-size: 13px; color: #6B7280; line-height: 1.4;">
            <div><strong>Vĩ độ:</strong> ${location.lat.toFixed(6)}</div>
            <div><strong>Kinh độ:</strong> ${location.lng.toFixed(6)}</div>
            <div><strong>Độ chính xác:</strong> ±${location.accuracy}m</div>
            <div style="margin-top: 6px; padding: 4px 8px; background: ${isTracking ? '#ECFDF5' : '#FEF2F2'}; border-radius: 4px; color: ${isTracking ? '#065F46' : '#991B1B'};">
              ${isTracking ? '🟢 Đang theo dõi GPS' : '🔴 GPS tạm dừng'}
            </div>
          </div>
        </div>
      `, { closeButton: false });

      markersRef.current.push(driverMarker);

      // Add sample student markers
      const students = [
        { id: 1, name: 'Nguyễn Văn A', lat: location.lat + 0.002, lng: location.lng + 0.003, status: 'waiting' },
        { id: 2, name: 'Trần Thị B', lat: location.lat - 0.001, lng: location.lng + 0.002, status: 'picked' },
        { id: 3, name: 'Lê Văn C', lat: location.lat + 0.001, lng: location.lng - 0.002, status: 'waiting' },
      ];

      students.forEach(student => {
        const studentIcon = L.divIcon({
          html: `
            <div style="
              width: 32px; 
              height: 32px; 
              background: ${student.status === 'waiting' ? '#F59E0B' : '#10B981'}; 
              border: 3px solid white; 
              border-radius: 50%; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 14px;
            ">
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
          <div style="font-family: system-ui; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; color: #1F2937; font-weight: bold;">👤 ${student.name}</h3>
            <div style="font-size: 13px; color: #6B7280;">
              <div>Trạng thái: <span style="color: ${student.status === 'waiting' ? '#D97706' : '#059669'}; font-weight: bold;">
                ${student.status === 'waiting' ? 'Chờ đón' : 'Đã đón'}
              </span></div>
              <div>Vị trí: ${student.lat.toFixed(6)}, ${student.lng.toFixed(6)}</div>
            </div>
          </div>
        `, { closeButton: false });

        markersRef.current.push(studentMarker);
      });

      // Center map on driver location
      mapInstanceRef.current.setView([location.lat, location.lng], zoom);

    } catch (error) {
      console.error('Error updating map location:', error);
    }
  };

  // Update map when location changes
  useEffect(() => {
    if (currentLocation && mapLoaded) {
      updateMapLocation(currentLocation);
    }
  }, [currentLocation, mapLoaded, isTracking]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (!isTracking) {
      getCurrentLocation();
      setAlert({ type: 'success', message: 'Bắt đầu theo dõi GPS' });
    } else {
      setAlert({ type: 'info', message: 'Dừng theo dõi GPS' });
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

  const toggleMapType = async () => {
    if (!mapInstanceRef.current) return;
    
    try {
      const L = await import('leaflet');
      
      // Remove current layers
      mapInstanceRef.current.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      // Add new layer based on type
      if (mapType === 'street') {
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: ''
        });
        satelliteLayer.addTo(mapInstanceRef.current);
        setMapType('satellite');
        setAlert({ type: 'info', message: 'Chuyển sang bản đồ vệ tinh' });
      } else {
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: ''
        });
        streetLayer.addTo(mapInstanceRef.current);
        setMapType('street');
        setAlert({ type: 'info', message: 'Chuyển sang bản đồ đường phố' });
      }
    } catch (error) {
      console.error('Error switching map type:', error);
    }
  };

  const centerOnLocation = () => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 17);
      setAlert({ type: 'success', message: 'Đã trở về vị trí hiện tại' });
    } else {
      getCurrentLocation();
    }
  };

  const sendEmergencyAlert = () => {
    setAlert({ type: 'warning', message: '🚨 Đã gửi cảnh báo khẩn cấp!' });
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
              Zoom: {zoom} • 
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
            className="absolute inset-0 w-full h-full"
            style={{ background: '#f0f0f0' }}
          />

          {/* Map Loading */}
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 text-lg">Đang tải bản đồ...</p>
              </div>
            </div>
          )}

          {/* Google-like Controls */}
          {mapLoaded && (
            <>
              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={zoomIn}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 transition-colors"
                  disabled={zoom >= 19}
                >
                  <Plus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={zoomOut}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={zoom <= 1}
                >
                  <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Map Type Control */}
              <div className="absolute top-4 right-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={toggleMapType}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Chuyển đổi loại bản đồ"
                >
                  <Layers className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Location Control */}
              <div className="absolute bottom-20 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                <button
                  onClick={centerOnLocation}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Về vị trí hiện tại"
                >
                  <Crosshair className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Floating Action Buttons */}
              <div className="absolute bottom-4 left-4 flex flex-col space-y-3">
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
                  onClick={sendEmergencyAlert}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 animate-pulse"
                >
                  <AlertTriangle className="h-4 w-4 mr-2 inline" />
                  SOS
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-600">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h3 className="text-lg font-bold flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Thông tin GPS
            </h3>
            <p className="text-sm opacity-90">Real-time tracking</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Current Location */}
            {currentLocation && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">📍 Vị trí hiện tại</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Vĩ độ:</span>
                    <span className="font-mono">{currentLocation.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kinh độ:</span>
                    <span className="font-mono">{currentLocation.lng.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Độ chính xác:</span>
                    <span>±{currentLocation.accuracy}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cập nhật:</span>
                    <span>{currentLocation.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Map Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">🗺️ Thông tin bản đồ</h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Mức zoom:</span>
                  <span>{zoom}/19</span>
                </div>
                <div className="flex justify-between">
                  <span>Loại bản đồ:</span>
                  <span>{mapType === 'street' ? 'Đường phố' : 'Vệ tinh'}</span>
                </div>
                <div className="flex justify-between">
                  <span>GPS:</span>
                  <span className={isTracking ? 'text-green-600' : 'text-red-600'}>
                    {isTracking ? '🟢 Hoạt động' : '🔴 Tạm dừng'}
                  </span>
                </div>
              </div>
            </div>

            {/* Students Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">👥 Học sinh</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center"><span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>Chờ đón</span>
                  <span className="font-bold text-orange-600">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>Đã đón</span>
                  <span className="font-bold text-green-600">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>Tổng cộng</span>
                  <span className="font-bold text-blue-600">3</span>
                </div>
              </div>
            </div>

            {/* Emergency */}
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

      {/* Alert Notifications */}
      {alert && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl z-[9999] transform transition-all duration-300 ${
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

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default GoogleLikeMap;