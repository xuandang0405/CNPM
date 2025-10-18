import React, { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { listSchedules, createSchedule, updateSchedule, deleteSchedule } from '../../api/schedules'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function ScheduleManager(){
  const [schedules, setSchedules] = useState([])
  const { lang } = useUserStore()
  useEffect(()=>{ load() }, [])
  async function load(){ setSchedules(await listSchedules()) }
  async function handleAdd(){ await createSchedule({ name: 'New Schedule', assignments: [] }); load() }
  async function handleEdit(row){ await updateSchedule(row.id, { name: row.name + ' U' }); load() }
  async function handleDelete(row){ await deleteSchedule(row.id); load() }

  const cols = [{ key: 'id', title: t(lang,'id') || 'ID' }, { key: 'name', title: t(lang,'name') || 'Name' }]
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl">{t(lang,'manage_schedules') || 'Manage Schedules'}</h2>
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleAdd}>{t(lang,'add_schedule') || 'Add Schedule'}</button>
      </div>
      <div className="card">
        <DataTable columns={cols} data={schedules} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  )
}
