import React from 'react'
import { Link } from 'react-router-dom'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function TripCard({ trip = { id: '1', name: 'Trip A - Morning', time: '07:00 - 08:30' } }){
  const { lang } = useUserStore()
  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-bold">{trip.name}</h3>
      <div className="text-sm muted">{t(lang,'start_trip')}: {trip.time}</div>
      <Link className="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded" to={`/driver/trip/${trip.id}`}>{t(lang,'start_trip')}</Link>
    </div>
  )
}
