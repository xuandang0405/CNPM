import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Play, Pause, Users, Crosshair, Plus, Minus, Layers, Route, Target, ArrowLeft } from 'lucide-react';
import { getScheduleStudents, updateTripStatus } from '../../api/trips';
import { useUserStore } from '../../store/useUserStore';
import { t } from '../../i18n';
 

const DriverMap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useUserStore();
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

  // Get schedule and students from navigation state or fetch from API
  const [schedule, setSchedule] = useState(location.state?.schedule || null);
  const [students, setStudents] = useState(location.state?.students || []);
  const [loading, setLoading] = useState(false);

  // Refresh students data every 10 seconds for real-time updates
  useEffect(() => {
    const refreshStudents = async () => {
      if (!schedule?.schedule_id) {
        return;
      }
      
      try {
        const data = await getScheduleStudents(schedule.schedule_id);
        
        if (data.success && data.students) {
          // Process students to use home location if stop location is missing
          const processedStudents = data.students.map(student => ({
            ...student,
            // Fallback: use home location if stop location not available
            display_lat: student.stop_lat || student.student_home_lat || null,
            display_lng: student.stop_lng || student.student_home_lng || null,
            location_source: student.stop_lat ? 'stop' : student.student_home_lat ? 'home' : 'none'
          }));
          
          setStudents(processedStudents);
          // Update markers with new status
          updateStudentMarkers(processedStudents);
        }
      } catch (error) {
        console.error('❌ Error refreshing students:', error);
      }
    };

    // Initial load if no students
    if (schedule && students.length === 0) {
      refreshStudents();
    }

    // Set up polling interval
    const intervalId = setInterval(refreshStudents, 10000); // Refresh every 10 seconds

    return () => clearInterval(intervalId);
  }, [schedule]);

  // Handler for pickup/dropoff student
  const handleUpdateStudentStatus = async (student, newStatus) => {
    if (!student.trip_id) {
  setAlert({ type: 'error', message: t(lang, 'not_found') + ' trip ID' });
      return;
    }

    try {
      const response = await updateTripStatus(student.trip_id, newStatus);
      if (response.success) {
        // Update local state immediately
        setStudents(prev => prev.map(s => 
          s.student_id === student.student_id 
            ? { ...s, trip_status: newStatus }
            : s
        ));
        
        // Update marker
        updateStudentMarkers(students.map(s => 
          s.student_id === student.student_id 
            ? { ...s, trip_status: newStatus }
            : s
        ));

  const statusText = newStatus === 'onboard' ? t(lang, 'on_bus') : 
        newStatus === 'dropped' ? t(lang, 'dropped_off') : 
        newStatus === 'absent' ? t(lang, 'absent') : t(lang, 'status');
  setAlert({ type: 'success', message: `✅ ${student.student_name} - ${statusText}` });
      }
    } catch (error) {
      console.error('Error updating student status:', error);
  setAlert({ type: 'error', message: t(lang, 'update_status_failed') });
    }
  };

  // Fetch students if not provided via state (legacy code - kept for compatibility)
  useEffect(() => {
    const fetchStudents = async () => {
      if (schedule && students.length === 0) {
        try {
          setLoading(true);
          const data = await getScheduleStudents(schedule.schedule_id);
          if (data.success && data.students) {
            setStudents(data.students);
          }
        } catch (error) {
          console.error('Error fetching students:', error);
          setAlert({ type: 'error', message: t(lang, 'load_students_failed') });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStudents();
  }, [schedule]);

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

        // Import routing machine CSS
        const routingCssLink = document.createElement('link');
        routingCssLink.rel = 'stylesheet';
        routingCssLink.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
        document.head.appendChild(routingCssLink);

        // Create map với scrollWheelZoom enabled
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
  setAlert({ type: 'error', message: t(lang, 'map_load_failed') });
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
  setAlert({ type: 'info', message: t(lang, 'using_default_location_hcm') });
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
  setAlert({ type: 'success', message: t(lang, 'location_updated') });
      },
      (error) => {
        console.error('GPS Error:', error);
        const defaultLocation = { lat: 10.8231, lng: 106.6297, accuracy: 100 };
        setCurrentLocation(defaultLocation);
        updateMapMarkers(defaultLocation);
  setAlert({ type: 'warning', message: t(lang, 'cannot_get_gps_using_default') });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
  setAlert({ type: 'error', message: t(lang, 'device_no_gps') });
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
  setAlert({ type: 'error', message: t(lang, 'gps_tracking_error') });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 1000 }
    );
  setAlert({ type: 'success', message: t(lang, 'started_gps_tracking') });
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  setAlert({ type: 'info', message: t(lang, 'stopped_gps_tracking') });
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
          <h3 class="font-bold text-lg text-gray-800 mb-2">🚌 ${t(lang,'smart_school_bus')}</h3>
          <div class="space-y-1 text-sm text-gray-600">
            <div><strong>${t(lang,'latitude')}:</strong> ${location.lat.toFixed(6)}</div>
            <div><strong>${t(lang,'longitude')}:</strong> ${location.lng.toFixed(6)}</div>
            <div><strong>${t(lang,'accuracy')}:</strong> ±${location.accuracy}m</div>
            <div class="mt-2 px-2 py-1 rounded ${isTracking ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
              ${isTracking ? '🟢 ' + t(lang,'tracking_label') : '🔴 ' + t(lang,'paused')}
            </div>
          </div>
        </div>
      `);

      markersRef.current.push(driverMarker);

      // Student markers - use real data from API
      addStudentMarkersToMap(L);

      // Center map on driver location
      if (students.length > 0) {
        // Create bounds that include driver and all students
        const bounds = L.latLngBounds([[location.lat, location.lng]]);
        students.forEach(student => {
          if (student.stop_lat && student.stop_lng) {
            bounds.extend([student.stop_lat, student.stop_lng]);
          }
        });
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        mapInstanceRef.current.setView([location.lat, location.lng], zoom);
      }

    } catch (error) {
      console.error('Error updating markers:', error);
    }
  };

  // Add student markers to map (separated for reusability)
  const addStudentMarkersToMap = async (L) => {
    students.forEach((student, index) => {
      // Use display_lat/lng (fallback to home address)
      const lat = student.display_lat || student.stop_lat || student.student_home_lat;
      const lng = student.display_lng || student.stop_lng || student.student_home_lng;
      
      // Skip if no location data at all
      if (!lat || !lng) {
        return;
      }
      
      const studentIcon = L.divIcon({
        html: `
          <div class="w-10 h-10 ${student.trip_status === 'waiting' || student.trip_status === 'scheduled' ? 'bg-orange-500 animate-bounce' : student.trip_status === 'onboard' ? 'bg-blue-500' : 'bg-green-500'} rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white text-sm cursor-pointer hover:scale-110 transition-transform">
            ${student.trip_status === 'waiting' || student.trip_status === 'scheduled' ? '👤' : student.trip_status === 'onboard' ? '🚌' : '✅'}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        className: 'student-marker'
      });

      const studentMarker = L.marker([lat, lng], {
        icon: studentIcon
      }).addTo(mapInstanceRef.current);

      const statusText =
        student.trip_status === 'scheduled' ? `📅 ${t(lang,'scheduled')}` :
        student.trip_status === 'waiting' ? `⏳ ${t(lang,'waiting_pickup')}` :
        student.trip_status === 'onboard' ? `🚌 ${t(lang,'on_bus')}` :
        student.trip_status === 'dropped' ? `✅ ${t(lang,'dropped_off')}` :
        `❌ ${t(lang,'absent')}`;

      const locationInfo = student.location_source === 'home' 
        ? `<div class="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded mt-1">📍 ${t(lang,'home_address')} (${t(lang,'no_stop_assigned_short')})</div>`
        : student.stop_name 
        ? `<div><strong>${t(lang,'pickup_stop')}:</strong> ${student.stop_name}</div>`
        : '';

      studentMarker.bindPopup(`
        <div class="p-3 font-sans">
          <h3 class="font-bold text-lg text-gray-800 mb-2">👤 ${student.student_name}</h3>
          <div class="text-sm text-gray-600 space-y-1">
            <div><strong>${t(lang,'grade_level')}:</strong> ${student.grade || t(lang,'unknown')} - <strong>${t(lang,'class_name')}:</strong> ${student.class || t(lang,'unknown')}</div>
            ${locationInfo}
            ${student.student_address ? `<div><strong>${t(lang,'home_address')}:</strong> ${student.student_address}</div>` : ''}
            <div><strong>${t(lang,'order')}:</strong> #${student.stop_order || t(lang,'unknown')}</div>
            <div><strong>${t(lang,'parent_label')}:</strong> ${student.parent_name || t(lang,'unknown')}</div>
            ${student.parent_phone ? `<div><strong>${t(lang,'phone')}:</strong> ${student.parent_phone}</div>` : ''}
            <div class="mt-2">
              <span class="${student.trip_status === 'waiting' || student.trip_status === 'scheduled' ? 'text-orange-600 bg-orange-100' : student.trip_status === 'onboard' ? 'text-blue-600 bg-blue-100' : 'text-green-600 bg-green-100'} px-2 py-1 rounded font-bold text-xs">
                ${statusText}
              </span>
            </div>
          </div>
        </div>
      `);

      // Add click event for navigation
      studentMarker.on('click', () => {
        setSelectedStudent(student);
        if (student.trip_status === 'waiting' || student.trip_status === 'scheduled') {
          navigateToStudent(student);
        }
      });

      markersRef.current.push(studentMarker);
    });
  };

  // Update only student markers when status changes
  const updateStudentMarkers = async (updatedStudents) => {
    if (!mapInstanceRef.current || !mapLoaded || !currentLocation) return;

    try {
      const L = await import('leaflet');
      
      // Remove only student markers (keep driver marker)
      const studentMarkers = markersRef.current.filter(marker => {
        const className = marker.options.icon?.options?.className;
        if (className === 'student-marker') {
          mapInstanceRef.current.removeLayer(marker);
          return false;
        }
        return true;
      });
      markersRef.current = studentMarkers;

      // Re-add student markers with updated status
      addStudentMarkersToMap(L);

    } catch (error) {
      console.error('Error updating student markers:', error);
    }
  };

  // Navigation to student using routing
  const navigateToStudent = async (student) => {
    if (!mapInstanceRef.current || !currentLocation) {
      setAlert({ type: 'error', message: t(lang, 'cannot_create_route') });
      return;
    }

    // Use display_lat/lng (fallback to home address)
    const targetLat = student.display_lat || student.stop_lat || student.student_home_lat;
    const targetLng = student.display_lng || student.stop_lng || student.student_home_lng;

    if (!targetLat || !targetLng) {
      setAlert({ type: 'error', message: t(lang, 'no_stop_assigned_short') });
      return;
    }

    try {
  // Import routing machine (side effects) and Leaflet
  const L = await import('leaflet');
  await import('leaflet-routing-machine');

      // Remove existing routing control
      if (routingControlRef.current) {
        mapInstanceRef.current.removeControl(routingControlRef.current);
      }

      // Create routing control
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(currentLocation.lat, currentLocation.lng),
          L.latLng(targetLat, targetLng)
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
        router: L.Routing.osrmv1({
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
          message: `${t(lang,'navigating_to_prefix')} ${student.student_name}: ${(summary.totalDistance / 1000).toFixed(1)} km - ${Math.round(summary.totalTime / 60)} ${t(lang,'minutes')}` 
        });
      });

      routingControlRef.current = routingControl;
      setSelectedStudent(student);

    } catch (error) {
      console.error('Error creating route:', error);
  setAlert({ type: 'error', message: t(lang, 'cannot_create_route_fallback_line') });
      
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
        [student.stop_lat, student.stop_lng]
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
        [student.stop_lat, student.stop_lng]
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
  setAlert({ type: 'info', message: t(lang, 'route_cleared') });
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
  setAlert({ type: 'success', message: t(lang, 'centered_on_current_location') });
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
        setAlert({ type: 'info', message: t(lang, 'switch_to_satellite') });
      } else {
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: 'OpenStreetMap'
        }).addTo(mapInstanceRef.current);
        setMapType('street');
        setAlert({ type: 'info', message: t(lang, 'switch_to_street') });
      }
    } catch (error) {
      console.error('Error switching map type:', error);
    };
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
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/driver/home')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={t(lang, 'back')}
            >
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <MapPin className="h-6 w-6 mr-2 text-blue-600" />
                {t(lang, 'trip_map')}
              </h1>
              {schedule && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t(lang,'route_label')}: {schedule.route_name} | {t(lang,'bus_label')}: {schedule.bus_plate} | {students.length} {t(lang,'students')}
                </p>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <MapPin className="h-6 w-6 mr-3 text-blue-600" />
              {t(lang,'smart_school_bus')} {t(lang,'map')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              GPS: {isTracking ? `🟢 ${t(lang,'online')}` : `🔴 ${t(lang,'paused')}`} • 
              {t(lang,'zoom_label')}: {zoom}/19 • 
              {t(lang,'mode')}: {mapType === 'street' ? t(lang,'street_map') : t(lang,'satellite_map')}
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
                <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">{t(lang,'loading_map')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t(lang,'map_stack_hint')}</p>
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
                  title={mapType === 'street' ? t(lang,'switch_to_satellite') : t(lang,'switch_to_street')}
                >
                  <Layers className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* My Location Button */}
              <div className="absolute bottom-32 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-20">
                <button
                  onClick={centerOnLocation}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={t(lang,'center_on_current_location')}
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
                    title={t(lang,'clear_route')}
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
                    {isTracking ? t(lang,'stop_gps') : t(lang,'start_gps')}
                  </div>
                </button>

                <button
                  onClick={getCurrentLocation}
                  className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
                >
                  📍 {t(lang,'update_location')}
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
              {t(lang,'navigation_panel')}
            </h3>
            <p className="text-sm opacity-90">
              {selectedStudent ? `${t(lang,'navigating_to_prefix')} ${selectedStudent.name || selectedStudent.student_name}` : t(lang,'select_student_to_navigate')}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Route Information */}
            {routeInfo && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700">
                <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                  <Route className="h-4 w-4 mr-2" />
                  {t(lang,'route_info')}
                </h4>
                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <div className="flex justify-between">
                    <span>{t(lang,'distance')}:</span>
                    <span className="font-bold">{routeInfo.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t(lang,'time')}:</span>
                    <span className="font-bold">{routeInfo.time} {t(lang,'minutes')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t(lang,'to_label')}:</span>
                    <span className="font-bold">{selectedStudent?.name || selectedStudent?.student_name}</span>
                  </div>
                </div>
                {routeInfo.instructions && (
                  <div className="mt-3">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">{t(lang,'directions')}:</h5>
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
                👥 {t(lang,'students')} ({students.length})
              </h4>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">{t(lang,'loading')}</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t(lang,'no_students_yet')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div key={student.student_id} className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 ${
                      student.trip_status === 'waiting' || student.trip_status === 'scheduled' ? 'border-orange-500' : 
                      student.trip_status === 'onboard' ? 'border-blue-500' : 'border-green-500'
                    } ${selectedStudent?.student_id === student.student_id ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 dark:text-white">{student.student_name}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{student.grade} - {student.class}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs text-white ${
                          student.trip_status === 'waiting' || student.trip_status === 'scheduled' ? 'bg-orange-500' : 
                          student.trip_status === 'onboard' ? 'bg-blue-500' : 'bg-green-500'
                        }`}>
                          {student.trip_status === 'waiting' || student.trip_status === 'scheduled' ? `⏳ ${t(lang,'waiting_pickup')}` : 
                           student.trip_status === 'onboard' ? `🚌 ${t(lang,'on_bus')}` : `✅ ${t(lang,'dropped_off')}`}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {student.stop_name}
                        </div>
                        {student.parent_name && (
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {t(lang,'parent_label')}: {student.parent_name}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {t(lang,'order')}: #{student.stop_order}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-2 space-y-2">
                        {(student.trip_status === 'waiting' || student.trip_status === 'scheduled') && student.stop_lat && student.stop_lng && (
                          <>
                            <button
                              onClick={() => navigateToStudent(student)}
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center"
                            >
                              <Route className="h-3 w-3 mr-1" />
                              {t(lang,'navigate')}
                            </button>
                            <button
                              onClick={() => handleUpdateStudentStatus(student, 'onboard')}
                              className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center"
                            >
                              🚌 {t(lang,'pick_up')}
                            </button>
                            <button
                              onClick={() => handleUpdateStudentStatus(student, 'absent')}
                              className="w-full bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center"
                            >
                              ❌ {t(lang,'absent')}
                            </button>
                          </>
                        )}
                        
                        {student.trip_status === 'onboard' && (
                          <button
                            onClick={() => handleUpdateStudentStatus(student, 'dropped')}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center"
                          >
                            ✅ {t(lang,'drop_off')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPS Information */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-600">
              {currentLocation && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                    📍 {t(lang,'gps_location')}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>{t(lang,'latitude')}:</span>
                      <span className="font-mono font-medium">{currentLocation.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t(lang,'longitude')}:</span>
                      <span className="font-mono font-medium">{currentLocation.lng.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t(lang,'accuracy')}:</span>
                      <span>±{currentLocation.accuracy}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t(lang,'status')}:</span>
                      <span className={`font-medium ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                        {isTracking ? `🟢 ${t(lang,'tracking_label')}` : `🔴 ${t(lang,'stopped')}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
              <button
                onClick={() => setAlert({ type: 'warning', message: t(lang,'notification_sent_to_parents') })}
                className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-lg"
              >
                📢 {t(lang,'notify_parents')}
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

export default DriverMap;