import React from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import BusMarker from './BusMarker'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../../contexts/ThemeContext'

export default function RouteMap({ buses = [] }) {
  const { isDark } = useTheme()
  const center = buses.length ? [buses[0].lat, buses[0].lng] : [10.762622, 106.660172]
  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      {isDark ? (
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OSM</a> &copy; <a href='https://carto.com/attributions'>CARTO</a>"
        />
      ) : (
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
      )}
      {buses.map(b => (
        <BusMarker key={b.id} bus={b} />
      ))}
    </MapContainer>
  )
}
