import React from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const studentWaitingIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135755.png',
  iconSize: [28, 28],
})

const studentOnboardIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61135.png',
  iconSize: [26, 26],
})

const studentDroppedIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
  iconSize: [24, 24],
})

export default function StudentMarker({ student }){
  const { display_lat, display_lng, trip_status } = student
  if (display_lat == null || display_lng == null) return null

  let icon = studentWaitingIcon
  if (trip_status === 'onboard') icon = studentOnboardIcon
  else if (trip_status === 'dropped') icon = studentDroppedIcon

  return (
    <Marker position={[display_lat, display_lng]} icon={icon}>
      <Popup>
        <div>
          <strong>{student.student_name}</strong>
          {student.stop_name && <div>Stop: {student.stop_name}</div>}
          <div>Status: {trip_status}</div>
        </div>
      </Popup>
    </Marker>
  )
}
