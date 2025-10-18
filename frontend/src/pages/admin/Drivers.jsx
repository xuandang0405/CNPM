import React, { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { listDrivers, createDriver, updateDriver, deleteDriver } from '../../api/drivers'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function Drivers() {
  const { lang } = useUserStore()
  const [drivers, setDrivers] = useState([])
  useEffect(() => { load() }, [])
  async function load(){ setDrivers(await listDrivers()) }
  async function handleAdd(){ await createDriver({ name: 'New Driver', phone: '000' }); load() }
  async function handleEdit(row){ await updateDriver(row.id, { name: row.name + ' U' }); load() }
  async function handleDelete(row){ await deleteDriver(row.id); load() }

  const cols = [ { key: 'id', title: t(lang,'id') || 'ID' }, { key: 'name', title: t(lang,'name') || 'Name' }, { key: 'phone', title: t(lang,'phone') || 'Phone' } ]
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl">{t(lang, 'manage_drivers')}</h2>
        <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={handleAdd}>{t(lang, 'add_driver')}</button>
      </div>
      <div className="card">
        <DataTable columns={cols} data={drivers} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  )
}
