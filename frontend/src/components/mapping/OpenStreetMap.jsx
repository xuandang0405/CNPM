import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom driver icon
const driverIcon = L.divIcon({
  html: `<div style="background: linear-gradient(45deg, #10B981, #059669); width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; font-weight: bold;">🚌</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: 'driver-marker animate-pulse'
});

// Student icons by status
const studentIcons = {
  waiting: L.divIcon({
    html: `<div style="background: linear-gradient(45deg, #F59E0B, #D97706); width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">⏳</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    className: 'student-marker-waiting'
  }),
  onboard: L.divIcon({
    html: `<div style="background: linear-gradient(45deg, #3B82F6, #2563EB); width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">🚌</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    className: 'student-marker-onboard'
  }),
  dropped: L.divIcon({
    html: `<div style="background: linear-gradient(45deg, #10B981, #059669); width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">✅</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    className: 'student-marker-dropped'
  })
};

const OpenStreetMap = ({
  center = { lat: 10.8231, lng: 106.6297 },
  zoom = 13,
  markers = [],
  showRouting = false,
  routeDestinations = [],
  onLocationUpdate,
  autoCenter = false,
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayerRef = useRef(null);
  const routingControlRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    console.log('Initializing OpenStreetMap...');

    // Create map instance
    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: false
    });

    // Add OpenStreetMap tile layer
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    });

    // Add satellite layer
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri',
      maxZoom: 19
    });

    // Add default layer
    osmLayer.addTo(map);

    // Add layer control
    const baseMaps = {
      "Bản đồ": osmLayer,
      "Vệ tinh": satelliteLayer
    };
    L.control.layers(baseMaps).addTo(map);

    // Create markers layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Add click listener for location updates
    if (onLocationUpdate) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        console.log('Map clicked:', { lat, lng });
        onLocationUpdate({ lat, lng });
      });
    }

    mapInstance.current = map;
    setIsMapReady(true);

    return () => {
      console.log('Cleaning up OpenStreetMap...');
      if (routingControlRef.current && mapInstance.current) {
        try {
          mapInstance.current.removeControl(routingControlRef.current);
        } catch (error) {
          console.log('Error removing routing control:', error);
        }
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update center when autoCenter is enabled
  useEffect(() => {
    if (mapInstance.current && autoCenter && center) {
      mapInstance.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, autoCenter, zoom]);

  // Update markers
  useEffect(() => {
    if (!markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add new markers
    markers.forEach(marker => {
      let markerIcon;
      
      if (marker.type === 'driver') {
        markerIcon = driverIcon;
      } else if (marker.type === 'student') {
        markerIcon = studentIcons[marker.status] || studentIcons.waiting;
      } else {
        markerIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
      }

      const leafletMarker = L.marker([marker.position.lat, marker.position.lng], {
        icon: markerIcon
      });

      // Add popup
      if (marker.title) {
        leafletMarker.bindPopup(`
          <div class="p-3">
            <h3 class="font-bold text-gray-800">${marker.title}</h3>
            ${marker.info ? `<p class="text-sm text-gray-600 mt-1">${marker.info}</p>` : ''}
          </div>
        `);
      }

      // Add click handler
      if (marker.onClick) {
        leafletMarker.on('click', marker.onClick);
      }

      leafletMarker.addTo(markersLayerRef.current);
    });
  }, [markers]);

  // Add routing functionality
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !showRouting || !routeDestinations?.length) {
      // Remove existing routing if no longer needed
      if (routingControlRef.current && mapInstance.current) {
        try {
          mapInstance.current.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (error) {
          console.log('Error removing routing control:', error);
        }
      }
      return;
    }

    console.log('Setting up routing...', routeDestinations);

    // Import and setup routing
    import('leaflet-routing-machine').then((RoutingMachine) => {
      if (!mapInstance.current || routingControlRef.current) return;

      try {
        // Create waypoints: current location + destinations
        const waypoints = [
          L.latLng(center.lat, center.lng), // Start from current location
          ...routeDestinations.map(dest => L.latLng(dest.lat, dest.lng))
        ];

        console.log('Creating route with waypoints:', waypoints);

        const routingControl = RoutingMachine.control({
          waypoints: waypoints,
          routeWhileDragging: false,
          addWaypoints: false,
          show: false, // Hide default routing panel
          createMarker: () => null, // Don't create default markers
          lineOptions: {
            styles: [{
              color: '#3B82F6',
              weight: 5,
              opacity: 0.8,
              dashArray: '10, 5'
            }]
          },
          router: RoutingMachine.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'driving'
          })
        });

        // Event handlers
        routingControl.on('routesfound', function(e) {
          const routes = e.routes;
          const summary = routes[0].summary;
          console.log('Route found:', summary);
          
          if (onLocationUpdate) {
            onLocationUpdate({
              type: 'route_found',
              distance: summary.totalDistance,
              time: summary.totalTime,
              instructions: routes[0].instructions
            });
          }
        });

        routingControl.on('routingerror', function(e) {
          console.error('Routing error:', e.error);
          if (onLocationUpdate) {
            onLocationUpdate({
              type: 'route_error',
              error: e.error?.message || 'Could not calculate route'
            });
          }
        });

        // Add to map
        routingControl.addTo(mapInstance.current);
        routingControlRef.current = routingControl;

        console.log('Routing control added successfully');

      } catch (error) {
        console.error('Error creating routing control:', error);
      }

    }).catch(error => {
      console.error('Error loading leaflet-routing-machine:', error);
    });

  }, [isMapReady, showRouting, routeDestinations, center, onLocationUpdate]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default OpenStreetMap;