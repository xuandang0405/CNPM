import React from 'react'
import TripCard from '../../components/driver/TripCard'

export default function DriverHome() {
  const trips = [ { id: '1', name: 'Trip A - Morning', time: '07:00 - 08:30' } ]
  return (
    <div>
      <h2 className="text-xl mb-4">Trips Today</h2>
      <div className="space-y-3">
        {trips.map(t => <TripCard key={t.id} trip={t} />)}
      </div>
    </div>
  )
}
