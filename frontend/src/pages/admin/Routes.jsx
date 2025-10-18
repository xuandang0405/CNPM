import React, { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { listRoutes, createRoute, updateRoute, deleteRoute } from '../../api/routes'
import useUserStore from '../../store/useUserStore'
import { t } from '../../i18n'

export default function RoutesPage() {
  const [routes, setRoutes] = useState([])
  const { lang } = useUserStore()
  useEffect(() => { load() }, [])
  async function load(){ setRoutes(await listRoutes()) }
  async function handleAdd(){ await createRoute({ name: 'New Route', stops: [] }); load() }
  async function handleEdit(row){ await updateRoute(row.id, { name: row.name + ' U' }); load() }
  async function handleDelete(row){ await deleteRoute(row.id); load() }
  const cols = [ { key: 'id', title: t(lang,'id') || 'ID' }, { key: 'name', title: t(lang,'name') || 'Name' }, { key: 'stops', title: t(lang,'stops') || 'Stops', render: r => (r.stops?.length ?? 0) } ]
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl">{t(lang,'manage_routes') || 'Manage Routes'}</h2>
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleAdd}>{t(lang,'add_route') || 'Add Route'}</button>
      </div>
      <div className="card">
        <DataTable columns={cols} data={routes} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  )
}
