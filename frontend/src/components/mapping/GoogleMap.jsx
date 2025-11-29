import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

const GoogleMap = ({ 
  center = { lat: 10.8231, lng: 106.6297 }, // Ho Chi Minh City default
  zoom = 13,
  children,
  onLocationUpdate,
  className = "w-full h-full"
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (mapRef.current && !map) {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      
      setMap(mapInstance);
      
      // Add click listener for location updates
      if (onLocationUpdate) {
        mapInstance.addListener('click', (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          onLocationUpdate({ lat, lng });
        });
      }
    }
  }, [map, center, zoom, onLocationUpdate]);

  // Update map center when center prop changes
  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  return (
    <div ref={mapRef} className={className} id="google-map">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { map });
        }
        return child;
      })}
    </div>
  );
};

const MapMarker = ({ 
  position, 
  title, 
  icon, 
  onClick,
  map 
}) => {
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    if (map && !marker) {
      const markerInstance = new window.google.maps.Marker({
        position,
        map,
        title,
        icon,
        animation: window.google.maps.Animation.DROP,
      });

      if (onClick) {
        markerInstance.addListener('click', onClick);
      }

      setMarker(markerInstance);
    }

    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [map, position, title, icon, onClick, marker]);

  useEffect(() => {
    if (marker) {
      marker.setPosition(position);
    }
  }, [marker, position]);

  return null;
};

const MapWrapper = ({ children, ...props }) => {
  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Đang tải bản đồ...</p>
            </div>
          </div>
        );
      case Status.FAILURE:
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Không thể tải bản đồ
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Vui lòng kiểm tra kết nối internet hoặc API key
              </p>
            </div>
          </div>
        );
      default:
        return (
          <GoogleMap {...props}>
            {children}
          </GoogleMap>
        );
    }
  };

  return (
    <Wrapper
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'demo-key'}
      render={render}
      libraries={['places', 'geometry']}
    />
  );
};

export default MapWrapper;
export { MapMarker };