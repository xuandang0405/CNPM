import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Import routing machine
let RoutingMachine = null;
try {
  RoutingMachine = require('leaflet-routing-machine');
} catch (e) {
  console.warn('Leaflet routing machine not available:', e);
}

// Fix for default markers in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom driver icon
const driverIcon = L.divIcon({
  html: `<div style="background: linear-gradient(45deg, #10B981, #059669); width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">🚌</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  className: 'driver-marker'
});

// Student icons by status
const studentIcons = {
  waiting: L.divIcon({
    html: `<div style="background: linear-gradient(45deg, #F59E0B, #D97706); width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">👤</div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    className: 'student-marker-waiting'
  }),
  onboard: L.divIcon({
    html: `<div style="background: linear-gradient(45deg, #3B82F6, #2563EB); width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">🚌</div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    className: 'student-marker-onboard'
  }),
  dropped: L.divIcon({
    html: `<div style="background: linear-gradient(45deg, #10B981, #059669); width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">✓</div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    className: 'student-marker-dropped'
  })
};

const OpenStreetMap = ({
  center = { lat: 10.8231, lng: 106.6297 }, // Ho Chi Minh City default
  zoom = 15,
  markers = [],
  onLocationUpdate,
  className = "w-full h-full",
  autoCenter = true,
  showRouting = false,
  routeDestinations = []
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markersLayer, setMarkersLayer] = useState(null);
  const [driverMarker, setDriverMarker] = useState(null);
  const [routingControl, setRoutingControl] = useState(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !map) {
      console.log('Initializing Leaflet map...');
      
      // Create map with better options
      const mapInstance = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        zoomSnap: 0.5,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true
      }).setView([center.lat, center.lng], zoom);
      
      // Add multiple tile layer options for better coverage
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 19,
        minZoom: 3
      });

      // Add default layer
      osmLayer.addTo(mapInstance);

      // Add layer control
      const baseMaps = {
        "Bản đồ": osmLayer,
        "Vệ tinh": satelliteLayer
      };
      L.control.layers(baseMaps).addTo(mapInstance);

      // Create markers layer
      const markersLayerGroup = L.layerGroup().addTo(mapInstance);
      setMarkersLayer(markersLayerGroup);

      // Add click listener for location updates
      if (onLocationUpdate) {
        mapInstance.on('click', (e) => {
          const { lat, lng } = e.latlng;
          console.log('Map clicked:', { lat, lng });
          onLocationUpdate({ lat, lng });
        });
      }

      setMap(mapInstance);
      
      return () => {
        console.log('Cleaning up map...');
        if (routingControl) {
          mapInstance.removeControl(routingControl);
        }
        mapInstance.remove();
      };
    }
  }, []);

  // Add routing functionality
  useEffect(() => {
    if (map && showRouting && routeDestinations.length > 0 && RoutingMachine && L.Routing) {
      console.log('Adding routing...', routeDestinations);
      
      // Remove existing routing
      if (routingControl) {
        map.removeControl(routingControl);
      }

      const waypoints = routeDestinations.map(dest => L.latLng(dest.lat, dest.lng));
      
      const control = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: true,
        addWaypoints: false,
        createMarker: function(i, waypoint, n) {
          const marker = L.marker(waypoint.latLng, {
            icon: studentIcons.waiting,
            draggable: false
          });
          
          if (routeDestinations[i]) {
            marker.bindPopup(`
              <div style="font-family: system-ui; padding: 8px;">
                <strong>📍 Điểm ${i + 1}</strong><br>
                <span style="color: #666;">${routeDestinations[i].name || 'Điểm dừng'}</span>
              </div>
            `);
          }
          
          return marker;
        },
        lineOptions: {
          styles: [{
            color: '#3B82F6',
            weight: 6,
            opacity: 0.8
          }]
        },
        show: false, // Hide turn-by-turn directions panel
        collapsible: false
      }).addTo(map);

      control.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        console.log('Route found:', summary);
        
        // You can emit route info here
        if (onLocationUpdate) {
          onLocationUpdate({
            type: 'route_found',
            distance: summary.totalDistance,
            time: summary.totalTime,
            route: routes[0]
          });
        }
      });

      setRoutingControl(control);
    }
  }, [map, showRouting, routeDestinations]);

  // Auto-center map when center changes
  useEffect(() => {
    if (map && center && autoCenter) {
      console.log('Updating map center to:', center);
      map.setView([center.lat, center.lng], map.getZoom(), {
        animate: true,
        duration: 1
      });
    }
  }, [map, center, autoCenter]);

  // Update markers
  useEffect(() => {
    if (map && markersLayer) {
      console.log('Updating markers:', markers.length);
      markersLayer.clearLayers();
      
      markers.forEach((marker) => {
        const { position, title, type, onClick, status } = marker;
        
        let markerIcon;
        if (type === 'driver') {
          markerIcon = driverIcon;
        } else if (type === 'student') {
          markerIcon = studentIcons[status] || studentIcons.waiting;
        } else {
          markerIcon = L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
          });
        }

        const leafletMarker = L.marker([position.lat, position.lng], { icon: markerIcon })
          .addTo(markersLayer);

        if (title) {
          leafletMarker.bindPopup(`
            <div style="font-family: system-ui; padding: 4px;">
              <strong>${title}</strong>
              ${status ? `<br><span style="color: #666; font-size: 12px;">Trạng thái: ${status}</span>` : ''}
            </div>
          `, {
            closeButton: true,
            autoClose: false
          });
        }

        if (onClick) {
          leafletMarker.on('click', onClick);
        }

        // Store driver marker for special handling
        if (type === 'driver') {
          setDriverMarker(leafletMarker);
        }
      });
    }
  }, [map, markersLayer, markers]);

  return <div ref={mapRef} className={className} style={{ height: '100%', width: '100%' }} />;
};

export default OpenStreetMap;