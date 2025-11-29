import React from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61135.png',
  iconSize: [32, 32],
})

export default function BusMarker({ bus }) {
  return (
    <Marker position={[bus.lat, bus.lng]} icon={busIcon}>
      <Popup>
        <div>
          <strong>{bus.id}</strong>
          <div>Speed: {bus.speed ?? '-'} km/h</div>
          <div>Students: {bus.students ?? '-'}</div>
        </div>
      </Popup>
    </Marker>
  )
}
