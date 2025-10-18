import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import PickUpList from '../../components/driver/PickUpList'
import AlertButton from '../../components/driver/AlertButton'
import QuickMessageModal from '../../components/driver/QuickMessageModal'
import RouteMap from '../../components/mapping/RouteMap'
import useRealtimeLocation from '../../hooks/useRealtimeLocation'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function DriverTrip() {
  const { id } = useParams()
  const [students, setStudents] = useState([
    { id: 's1', name: 'Lê Văn B', address: '123 Đường A', status: 'waiting' },
    { id: 's2', name: 'Trần Thị C', address: '45 Đường B', status: 'waiting' },
  ])
  const [showQuick, setShowQuick] = useState(false)
  const { buses } = useRealtimeLocation({ mode: 'single', busId: 'bus-1' })

  function centerOnBus(){
    // naive: just log — the RouteMap could expose imperative methods later
    console.log('center on bus')
  }

  function handlePicked(studentId){
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'picked' } : s))
  }
  function handleDropped(studentId){
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'dropped' } : s))
  }

  function handleSendQuick(msg){
    // For now we just console.log; in real app send to backend
    console.log('quick message', msg)
  }

  const { lang } = useUserStore()
  return (
    <div>
      <h2 className="text-xl mb-4">{t(lang,'start_trip')} {id}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card h-[420px] p-0 overflow-hidden">
          <RouteMap buses={buses.length ? buses : []} />
        </div>

        <div className="space-y-3">
          <PickUpList students={students} onPicked={handlePicked} onDropped={handleDropped} />
          <div className="flex gap-2">
            <button className="btn" onClick={centerOnBus}>{t(lang,'navigate')}</button>
          </div>
        </div>
      </div>

      <AlertButton onClick={()=>setShowQuick(true)} />
      <QuickMessageModal open={showQuick} onClose={()=>setShowQuick(false)} onSend={handleSendQuick} />
    </div>
  )
}
