import React, { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { listBuses, createBus, updateBus, deleteBus } from '../../api/buses'

import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function Buses() {
  const { lang } = useUserStore()
  const [buses, setBuses] = useState([])
  useEffect(() => { load() }, [])
  async function load(){ setBuses(await listBuses()) }
  async function handleAdd(){ const b = await createBus({ plate: 'NEW', capacity: 20 }); load() }
  async function handleEdit(row){ await updateBus(row.id, { plate: row.plate + '-u' }); load() }
  async function handleDelete(row){ await deleteBus(row.id); load() }

  const cols = [ { key: 'id', title: t(lang,'id') || 'ID' }, { key: 'plate', title: t(lang,'plate') || 'Plate' }, { key: 'capacity', title: t(lang,'capacity') || 'Capacity' } ]
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl">{t(lang, 'manage_buses')}</h2>
        <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={handleAdd}>{t(lang, 'add_bus')}</button>
      </div>
      <div className="card">
        <DataTable columns={cols} data={buses} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  )
}
