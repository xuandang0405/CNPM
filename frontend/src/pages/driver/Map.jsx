import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function Map({ currentLocation, students }) {
  const center = currentLocation 
    ? [currentLocation.lat, currentLocation.lng]
    : [10.7731, 106.7031] // Default center (HCMC)

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]}>
          <Popup>Vị trí hiện tại</Popup>
        </Marker>
      )}

      {students.map(student => (
        <Marker 
          key={student.id}
          position={[student.lat, student.lng]}
        >
          <Popup>
            <div>
              <strong>{student.name}</strong>
              <p>{student.address}</p>
              {student.eta && (
                <p>ETA: {student.eta} phút</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}