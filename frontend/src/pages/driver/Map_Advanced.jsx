import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertTriangle, Play, Pause, Users, Crosshair, Plus, Minus, Layers, Route, Target } from 'lucide-react';

const DriverMapAdvanced = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routingControlRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [alert, setAlert] = useState(null);
  const [zoom, setZoom] = useState(16);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState('street');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const markersRef = useRef([]);
  const watchIdRef = useRef(null);

  // Sample students data
  const [students] = useState([
    { 
      id: 1, 
      name: 'Nguyễn Văn A', 
      grade: 'Lớp 8A',
      address: '123 Đường ABC, Quận 1',
      lat: 10.8251, 
      lng: 106.6317, 
      status: 'waiting',
      pickupTime: '07:15'
    },
    { 
      id: 2, 
      name: 'Trần Thị B', 
      grade: 'Lớp 8B',
      address: '456 Đường DEF, Quận 3', 
      lat: 10.8201, 
      lng: 106.6337, 
      status: 'picked',
      pickupTime: '07:20'
    },
    { 
      id: 3, 
      name: 'Lê Văn C', 
      grade: 'Lớp 7A',
      address: '789 Đường GHI, Quận 5', 
      lat: 10.8281, 
      lng: 106.6257, 
      status: 'waiting',
      pickupTime: '07:25'
    },
  ]);

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
        // Import Leaflet and routing machine
        const L = await import('leaflet');
        
        // Import CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);

        // Import routing machine CSS
        const routingCssLink = document.createElement('link');
        routingCssLink.rel = 'stylesheet';
        routingCssLink.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
        document.head.appendChild(routingCssLink);

        // Fix marker icons
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (!mapRef.current || mapInstanceRef.current) return;

        // Create map với scrollWheelZoom disabled cho panel nhưng enabled cho map
        const map = L.map(mapRef.current, {
          center: [10.8231, 106.6297],
          zoom: 16,
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: true, // Enable scroll wheel zoom on map
        });

        // Prevent scroll wheel zoom on sidebar
        const sidebar = document.querySelector('.map-sidebar');
        if (sidebar) {
          sidebar.addEventListener('wheel', (e) => {
            e.stopPropagation();
          }, { passive: false });
        }

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
            <div class="absolute -top-1 -right-1 w-4 h-4 ${isTracking ? 'bg-green-500 animate-ping' : 'bg-red-500'} rounded-full border-2 border-white"></div>
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

      // Student markers
      students.forEach(student => {
        const studentIcon = L.divIcon({
          html: `
            <div class="w-10 h-10 ${student.status === 'waiting' ? 'bg-orange-500 animate-bounce' : 'bg-green-500'} rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white text-sm cursor-pointer hover:scale-110 transition-transform">
              ${student.status === 'waiting' ? '👤' : '✅'}
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          className: 'student-marker'
        });

        const studentMarker = L.marker([student.lat, student.lng], {
          icon: studentIcon
        }).addTo(mapInstanceRef.current);

        studentMarker.bindPopup(`
          <div class="p-3 font-sans">
            <h3 class="font-bold text-lg text-gray-800 mb-2">👤 ${student.name}</h3>
            <div class="text-sm text-gray-600 space-y-1">
              <div><strong>Lớp:</strong> ${student.grade}</div>
              <div><strong>Địa chỉ:</strong> ${student.address}</div>
              <div><strong>Giờ đón:</strong> ${student.pickupTime}</div>
              <div class="mt-2">
                <span class="${student.status === 'waiting' ? 'text-orange-600 bg-orange-100' : 'text-green-600 bg-green-100'} px-2 py-1 rounded font-bold">
                  ${student.status === 'waiting' ? '⏳ Chờ đón' : '✅ Đã đón'}
                </span>
              </div>
              ${student.status === 'waiting' ? `
                <button onclick="window.navigateToStudent(${student.id})" class="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
                  🗺️ Tìm đường
                </button>
              ` : ''}
            </div>
          </div>
        `);

        // Add click event for navigation
        studentMarker.on('click', () => {
          if (student.status === 'waiting') {
            setSelectedStudent(student);
            navigateToStudent(student);
          }
        });

        markersRef.current.push(studentMarker);
      });

      // Center map
      mapInstanceRef.current.setView([location.lat, location.lng], zoom);

    } catch (error) {
      console.error('Error updating markers:', error);
    }
  };

  // Navigation to student using routing
  const navigateToStudent = async (student) => {
    if (!mapInstanceRef.current || !currentLocation) {
      setAlert({ type: 'error', message: 'Không thể tạo đường đi' });
      return;
    }

    try {
      // Import routing machine
      const RoutingMachine = await import('leaflet-routing-machine');
      const L = await import('leaflet');

      // Remove existing routing control
      if (routingControlRef.current) {
        mapInstanceRef.current.removeControl(routingControlRef.current);
      }

      // Create routing control
      const routingControl = RoutingMachine.control({
        waypoints: [
          L.latLng(currentLocation.lat, currentLocation.lng),
          L.latLng(student.lat, student.lng)
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        createMarker: () => null, // Don't create default markers
        lineOptions: {
          styles: [{
            color: '#3B82F6',
            weight: 6,
            opacity: 0.8,
            dashArray: '10, 5'
          }]
        },
        show: false, // Hide default instruction panel
        router: RoutingMachine.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving'
        })
      }).addTo(mapInstanceRef.current);

      // Handle route found
      routingControl.on('routesfound', (e) => {
        const routes = e.routes;
        const summary = routes[0].summary;
        
        setRouteInfo({
          distance: (summary.totalDistance / 1000).toFixed(1),
          time: Math.round(summary.totalTime / 60),
          instructions: routes[0].instructions.slice(0, 5) // First 5 instructions
        });

        setAlert({ 
          type: 'success', 
          message: `Đã tìm thấy đường đến ${student.name}: ${(summary.totalDistance / 1000).toFixed(1)}km - ${Math.round(summary.totalTime / 60)} phút` 
        });
      });

      routingControlRef.current = routingControl;
      setSelectedStudent(student);

    } catch (error) {
      console.error('Error creating route:', error);
      setAlert({ type: 'error', message: 'Không thể tạo đường đi. Sử dụng đường thẳng.' });
      
      // Fallback: draw straight line
      drawStraightLine(student);
    }
  };

  // Fallback: Draw straight line
  const drawStraightLine = async (student) => {
    try {
      const L = await import('leaflet');
      
      const polyline = L.polyline([
        [currentLocation.lat, currentLocation.lng],
        [student.lat, student.lng]
      ], {
        color: '#EF4444',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(mapInstanceRef.current);

      markersRef.current.push(polyline);

      // Calculate straight line distance
      const distance = mapInstanceRef.current.distance(
        [currentLocation.lat, currentLocation.lng],
        [student.lat, student.lng]
      );

      setRouteInfo({
        distance: (distance / 1000).toFixed(1),
        time: Math.round(distance / 1000 * 3), // Estimate 3 min per km
        instructions: [`Đi thẳng đến ${student.name}`]
      });

    } catch (error) {
      console.error('Error drawing line:', error);
    }
  };

  // Clear route
  const clearRoute = () => {
    if (routingControlRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    setSelectedStudent(null);
    setRouteInfo(null);
    setAlert({ type: 'info', message: 'Đã xóa đường đi' });
  };

  // Map controls
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

  // Make navigateToStudent globally available for popup buttons
  useEffect(() => {
    window.navigateToStudent = (studentId) => {
      const student = students.find(s => s.id === studentId);
      if (student) {
        navigateToStudent(student);
      }
    };
    return () => {
      delete window.navigateToStudent;
    };
  }, [students, currentLocation]);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <MapPin className="h-6 w-6 mr-3 text-blue-600" />
              Smart Bus Navigation System
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              GPS: {isTracking ? '🟢 Hoạt động' : '🔴 Tạm dừng'} • 
              Zoom: {zoom}/19 • 
              {selectedStudent && `🎯 Đang điều hướng đến ${selectedStudent.name}`}
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
      <div className="flex-1 flex overflow-hidden">
        {/* Map Container - Isolated scroll */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef} 
            className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-700"
            style={{ zIndex: 1 }}
          />

          {/* Loading Overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-90 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Đang tải Google-like Map...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Leaflet + OpenStreetMap + Routing</p>
              </div>
            </div>
          )}

          {/* Map Controls - Fixed position, high z-index */}
          {mapLoaded && (
            <>
              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden z-20">
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
              <div className="absolute top-4 right-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-20">
                <button
                  onClick={toggleMapType}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={`Chuyển sang ${mapType === 'street' ? 'vệ tinh' : 'đường phố'}`}
                >
                  <Layers className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* My Location Button */}
              <div className="absolute bottom-32 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-20">
                <button
                  onClick={centerOnLocation}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Về vị trí hiện tại"
                >
                  <Crosshair className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Clear Route Button */}
              {selectedStudent && (
                <div className="absolute bottom-44 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-20">
                  <button
                    onClick={clearRoute}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600"
                    title="Xóa đường đi"
                  >
                    <Target className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Control Buttons */}
              <div className="absolute bottom-4 left-4 flex flex-col space-y-3 z-20">
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

        {/* Info Sidebar - Separate scroll */}
        <div className="w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-600 flex flex-col map-sidebar">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0">
            <h3 className="text-lg font-bold flex items-center">
              <Navigation className="h-5 w-5 mr-2" />
              Navigation Panel
            </h3>
            <p className="text-sm opacity-90">
              {selectedStudent ? `Đang điều hướng đến ${selectedStudent.name}` : 'Chọn học sinh để tìm đường'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Route Information */}
            {routeInfo && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700">
                <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                  <Route className="h-4 w-4 mr-2" />
                  Thông tin đường đi
                </h4>
                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <div className="flex justify-between">
                    <span>Khoảng cách:</span>
                    <span className="font-bold">{routeInfo.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian:</span>
                    <span className="font-bold">{routeInfo.time} phút</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đến:</span>
                    <span className="font-bold">{selectedStudent?.name}</span>
                  </div>
                </div>
                {routeInfo.instructions && (
                  <div className="mt-3">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Hướng dẫn:</h5>
                    <div className="space-y-1 text-xs text-blue-600 dark:text-blue-400 max-h-20 overflow-y-auto">
                      {routeInfo.instructions.map((instruction, index) => (
                        <div key={index} className="flex items-start">
                          <span className="font-bold mr-2">{index + 1}.</span>
                          <span>{instruction.text || instruction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Students List */}
            <div className="p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                👥 Học sinh trên tuyến ({students.length})
              </h4>
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 ${
                    student.status === 'waiting' ? 'border-orange-500' : 'border-green-500'
                  } ${selectedStudent?.id === student.id ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 dark:text-white">{student.name}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{student.grade}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs text-white ${
                        student.status === 'waiting' ? 'bg-orange-500' : 'bg-green-500'
                      }`}>
                        {student.status === 'waiting' ? 'Chờ đón' : 'Đã đón'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {student.address}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        Giờ đón: {student.pickupTime}
                      </div>
                    </div>
                    {student.status === 'waiting' && (
                      <button
                        onClick={() => navigateToStudent(student)}
                        className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        <Route className="h-3 w-3 inline mr-1" />
                        Tìm đường
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* GPS Information */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-600">
              {currentLocation && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                    📍 Vị trí GPS
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
                      <span>Trạng thái:</span>
                      <span className={`font-medium ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                        {isTracking ? '🟢 Theo dõi' : '🔴 Dừng'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
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
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl z-50 transform transition-all duration-300 max-w-sm ${
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

export default DriverMapAdvanced;