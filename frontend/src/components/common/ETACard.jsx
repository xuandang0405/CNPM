import React from 'react'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = v => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2)) * Math.sin(dLon/2)*Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export default function ETACard({ bus, target = { lat: 10.776530, lng: 106.700981 } }){
  const { lang } = useUserStore()
  if (!bus) return null
  const distKm = haversineKm(bus.lat, bus.lng, target.lat, target.lng)
  const speedKmh = bus.speed || 0
  let etaText = t(lang, 'no_data')
  if (speedKmh > 0) {
    const hours = distKm / speedKmh
    const minutes = Math.max(1, Math.round(hours * 60))
    etaText = `${minutes} ${t(lang,'minutes')}`
  } else if (bus.speed === 0) {
    etaText = '---'
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm muted">{t(lang,'estimated_arrival')}</div>
          <div className="text-2xl font-bold">{etaText}</div>
        </div>
        <div className="text-right">
          <div className="muted text-sm">{t(lang,'distance')}</div>
          <div className="font-semibold">{distKm.toFixed(2)} km</div>
        </div>
      </div>
      <div className="mt-3 text-sm muted">{t(lang,'bus')}: {bus.id}</div>
    </div>
  )
}
