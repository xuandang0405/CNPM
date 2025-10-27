import React from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../../contexts/ThemeContext'
import BusMarker from './BusMarker'
import StudentMarker from './StudentMarker'

export default function AdminDriverMap({ bus = null, students = [] }){
  const { isDark } = useTheme()
  const center = bus && bus.current_lat && bus.current_lng 
    ? [bus.current_lat, bus.current_lng]
    : students.length && students[0].display_lat && students[0].display_lng 
    ? [students[0].display_lat, students[0].display_lng]
    : [10.762622, 106.660172]

  // Adapt bus data to BusMarker props
  const busData = bus ? {
    id: bus.bus_id || bus.id || bus.bus_plate,
    lat: bus.current_lat,
    lng: bus.current_lng,
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
