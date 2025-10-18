import React, { useState, useEffect } from 'react'
import DriverInfoCard from '../../components/parent/DriverInfoCard'
import SafetyZoneSettings from '../../components/parent/SafetyZoneSettings'
import AbsenceReportModal from '../../components/parent/AbsenceReportModal'
import RouteMap from '../../components/mapping/RouteMap'
import { listBuses } from '../../api/buses'
import useRealtimeLocation from '../../hooks/useRealtimeLocation'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function ParentTracking(){
  const [showAbsence, setShowAbsence] = useState(false)
  const [safetyRadius, setSafetyRadius] = useState(500)
  const [allBuses, setAllBuses] = useState([])
  const [selectedBus, setSelectedBus] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load(){
      const bs = await listBuses()
      if (!mounted) return
      setAllBuses(bs)
      if (bs.length) setSelectedBus(bs[0].id)
    }
    load()
    return () => { mounted = false }
  }, [])

  const { buses } = useRealtimeLocation({ mode: 'single', busId: selectedBus })
  const currentBus = buses[0] || allBuses.find(b=>b.id===selectedBus)

  const mockDriver = { name: 'Nguyễn Văn A', phone: '+84901234567', plate: currentBus?.plate || '29A-0001', avatar: '' }

  const { lang } = useUserStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl">{t(lang,'tracking')} - {t(lang,'track_child') || 'Theo dõi chuyến xe của con'}</h2>
        <div className="flex items-center gap-2">
          <select className="form-input" value={selectedBus || ''} onChange={e=>setSelectedBus(e.target.value)}>
            <option value="">{t(lang,'select_bus') || 'Chọn xe'}</option>
            {allBuses.map(b => <option key={b.id} value={b.id}>{b.id} - {b.plate}</option>)}
          </select>
          <button className="btn ml-2" onClick={() => setShowAbsence(true)}>{t(lang,'report_absence') || 'Báo vắng'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card h-[420px] p-0 overflow-hidden">
          <RouteMap buses={currentBus ? [ { ...currentBus, lat: currentBus.lat || 10.7765, lng: currentBus.lng || 106.7009 } ] : []} />
        </div>

        <div className="space-y-4">
          <DriverInfoCard driver={{ ...mockDriver }} />

          <div className="card">
            <h3 className="mb-2">{t(lang,'trip_info') || 'Thông tin chuyến'}</h3>
            <div className="text-sm muted">{t(lang,'vehicle') || 'Xe'}: {currentBus?.id || '---'} • {currentBus?.plate || '---'}</div>
            <div className="mt-2">{t(lang,'speed_label') || 'Tốc độ'}: {currentBus?.speed ?? '---'} km/h</div>
            <div className="mt-2">{t(lang,'students_on_bus') || 'Học sinh trên xe'}: {currentBus?.students ?? '---'}</div>
            <div className="mt-2">{t(lang,'status_label') || 'Trạng thái'}: {currentBus?.delay ? (t(lang,'late')||'Trễ') : (t(lang,'running')||'Đang chạy')}</div>
          </div>

          <SafetyZoneSettings value={safetyRadius} onChange={r=>setSafetyRadius(r)} />
        </div>
      </div>

      <AbsenceReportModal open={showAbsence} onClose={()=>setShowAbsence(false)} onSubmit={(data)=>console.log('absence', data)} />
    </div>
  )
}
