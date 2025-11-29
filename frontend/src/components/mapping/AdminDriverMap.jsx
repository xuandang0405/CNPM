import React from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../../contexts/ThemeContext'
import BusMarker from './BusMarker'
import StudentMarker from './StudentMarker'

export default function AdminDriverMap({ bus = null, students = [] }){
  const { isDark } = useTheme()
  // Normalize to numbers to avoid string coercion issues
  const busLat = bus?.current_lat != null ? Number(bus.current_lat) : null
  const busLng = bus?.current_lng != null ? Number(bus.current_lng) : null

  const center = busLat != null && busLng != null 
    ? [busLat, busLng]
    : (students.length && students[0].display_lat != null && students[0].display_lng != null)
    ? [Number(students[0].display_lat), Number(students[0].display_lng)]
    : [10.762622, 106.660172]

  // Adapt bus data to BusMarker props
  const busData = bus && busLat != null && busLng != null ? {
    id: bus.bus_id || bus.id || bus.bus_plate,
    lat: busLat,
    lng: busLng,
    speed: bus.speed,
    students: bus.students_onboard
  } : null

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

      {busData && <BusMarker bus={busData} />}
      {students && students.map(st => (
        <StudentMarker key={st.student_id} student={st} />
      ))}
    </MapContainer>
  )
}
