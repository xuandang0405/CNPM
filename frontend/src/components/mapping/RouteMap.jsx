import React from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import BusMarker from './BusMarker'
import 'leaflet/dist/leaflet.css'

export default function RouteMap({ buses = [] }) {
  const center = buses.length ? [buses[0].lat, buses[0].lng] : [10.762622, 106.660172]
  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {buses.map(b => (
        <BusMarker key={b.id} bus={b} />
      ))}
    </MapContainer>
  )
}
