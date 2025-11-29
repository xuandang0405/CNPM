import React, { useState, useEffect } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { Modal } from '../../components/common/Modal'
import { listRoutes, createRoute, updateRoute, deleteRoute, getRoute, addRouteStop, deleteRouteStop, updateRouteStop } from '../../api/routes'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import { TableSkeleton } from '../../components/common/Skeleton'

export default function RoutesPage() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [formData, setFormData] = useState({ name: '' })
  const [submitting, setSubmitting] = useState(false)
  // Manage stops modal
  const [stopsModalOpen, setStopsModalOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [stops, setStops] = useState([])
  const [stopForm, setStopForm] = useState({ name: '', lat: '', lng: '', is_pickup: true })
  const [editingStopId, setEditingStopId] = useState(null)
  const [editingStopData, setEditingStopData] = useState({ name: '', lat: '', lng: '', is_pickup: true })
  const { lang } = useUserStore()

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const data = await listRoutes()
      const routesList = Array.isArray(data) ? data : (data?.routes || [])
      setRoutes(routesList)
      setError('')
    } catch (err) {
      console.error('Failed to load routes:', err)
      setRoutes([])
      setError(t(lang,'load_list_failed_try_again'))
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingRoute(null)
    setFormData({ name: '' })
    setModalOpen(true)
  }

  function openEditModal(row) {
    setEditingRoute(row)
    setFormData({ name: row.name || '' })
    setModalOpen(true)
  }

  async function openStopsModal(route) {
    setSelectedRoute(route)
    setStops([])
    setStopForm({ name: '', lat: '', lng: '', is_pickup: true })
    setEditingStopId(null)
    setStopsModalOpen(true)
    try{
      const full = await getRoute(route.id)
      setStops(full?.stops || [])
    }catch(e){
      console.error('Failed to load route stops', e)
    }
  }

  function closeModal() {
    setModalOpen(false)
    setEditingRoute(null)
    setFormData({ name: '' })
  }

  // ---- Stops helpers ----
  const sortedStops = [...stops].sort((a,b)=> (a.stop_order||0)-(b.stop_order||0))

  async function moveStopUp(stop){
    const idx = sortedStops.findIndex(s => s.id === stop.id)
    if (idx <= 0) return
    const prev = sortedStops[idx-1]
    try{
      // swap orders
      await updateRouteStop(selectedRoute.id, stop.id, { stop_order: prev.stop_order })
      await updateRouteStop(selectedRoute.id, prev.id, { stop_order: stop.stop_order })
      // update local
      setStops(curr => curr.map(s => {
        if (s.id === stop.id) return { ...s, stop_order: prev.stop_order }
        if (s.id === prev.id) return { ...s, stop_order: stop.stop_order }
        return s
      }))
    }catch(e){
      console.error('Move up failed', e)
      alert(t(lang,'move_up_failed'))
    }
  }

  async function moveStopDown(stop){
    const idx = sortedStops.findIndex(s => s.id === stop.id)
    if (idx === -1 || idx >= sortedStops.length - 1) return
    const next = sortedStops[idx+1]
    try{
      await updateRouteStop(selectedRoute.id, stop.id, { stop_order: next.stop_order })
      await updateRouteStop(selectedRoute.id, next.id, { stop_order: stop.stop_order })
      setStops(curr => curr.map(s => {
        if (s.id === stop.id) return { ...s, stop_order: next.stop_order }
        if (s.id === next.id) return { ...s, stop_order: stop.stop_order }
        return s
      }))
    }catch(e){
      console.error('Move down failed', e)
      alert(t(lang,'move_down_failed'))
    }
  }

  function startEditStop(s){
    setEditingStopId(s.id)
    setEditingStopData({ name: s.name || '', lat: s.lat, lng: s.lng, is_pickup: !!s.is_pickup })
  }

  function cancelEditStop(){
    setEditingStopId(null)
  }

  async function saveEditStop(){
    if (!editingStopId || !selectedRoute) return
    const payload = {
      name: (editingStopData.name || '').trim(),
      lat: parseFloat(editingStopData.lat),
      lng: parseFloat(editingStopData.lng),
      is_pickup: !!editingStopData.is_pickup
    }
    if (!payload.name || isNaN(payload.lat) || isNaN(payload.lng)){
      alert(t(lang,'enter_valid_stop_fields'))
      return
    }
    try{
      await updateRouteStop(selectedRoute.id, editingStopId, payload)
      setStops(curr => curr.map(s => s.id === editingStopId ? { ...s, ...payload } : s))
      setEditingStopId(null)
    }catch(e){
      console.error('Update stop failed', e)
      alert(t(lang,'update_stop_failed'))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên tuyến đường')
      return
    }

    try {
      setSubmitting(true)
      if (editingRoute) {
        await updateRoute(editingRoute.id, formData)
      } else {
        await createRoute(formData)
      }
      closeModal()
      load()
    } catch (err) {
      setError(editingRoute ? 'Lỗi cập nhật tuyến đường' : 'Lỗi thêm tuyến đường')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(row) {
    if (!window.confirm('Bạn có chắc muốn xóa tuyến đường này?')) return
    try {
      await deleteRoute(row.id)
      load()
    } catch (err) {
      console.error('Failed to delete route:', err)
      setError('Lỗi xóa tuyến đường')
    }
  }
  const cols = [ 
    { key: 'id', title: t(lang,'id') || 'ID' }, 
    { key: 'name', title: t(lang,'name') || 'Name' }, 
    { key: 'stops', title: t(lang,'stops') || 'Stops', render: r => (r.stops?.length ?? 0) } 
  ]

  return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <span className="text-3xl">🗺️</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold">{t(lang,'routes_page_title')}</h2>
                <p className="text-purple-100 mt-1">{t(lang,'routes_total_label')}: {routes.length}</p>
              </div>
            </div>
            <button 
              className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors font-medium shadow-lg flex items-center gap-2 disabled:opacity-50" 
              onClick={openAddModal}
              disabled={loading}
            >
              <span>➕</span> {t(lang,'add_route')}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Routes Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-500 dark:text-gray-400">{t(lang,'loading_list')}</p>
            </div>
          ) : routes.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">🗺️</span>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{t(lang,'none_yet')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">{t(lang,'id')}</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">{t(lang,'route_name')}</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">{t(lang,'stops')}</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">{t(lang,'actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-gray-600 dark:text-gray-300 font-mono text-sm">#{route.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {route.name?.charAt(0)?.toUpperCase() || 'R'}
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{route.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium">
                          <span>📍</span> {route.stops?.length || 0} {t(lang,'stops')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openStopsModal(route)}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                          >
                            📍 {t(lang,'manage_stops')}
                          </button>
                          <button
                            onClick={() => openEditModal(route)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            ✏️ {t(lang,'edit_item')}
                          </button>
                          <button
                            onClick={() => handleDelete(route)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            🗑️ {t(lang,'delete_item')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} title={editingRoute ? t(lang,'edit_item') : t(lang,'add_route')} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t(lang,'route_name')} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={t(lang,'route_name')}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
              disabled={submitting}
            >
              {t(lang,'cancel_button')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              disabled={submitting}
            >
              {submitting ? t(lang,'loading') : t(lang,'save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stops Management Modal */}
      <Modal open={stopsModalOpen} title={selectedRoute ? `${t(lang,'manage_stops')} - ${selectedRoute.name}` : t(lang,'manage_stops')} onClose={() => setStopsModalOpen(false)}>
        {!selectedRoute ? (
          <div className="text-gray-500">{t(lang,'no_route_selected')}</div>
        ) : (
          <div className="space-y-5">
            {/* Add stop form */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-3">{t(lang,'add_new_stop')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">{t(lang,'stop_name')} *</label>
                  <input
                    type="text"
                    value={stopForm.name}
                    onChange={(e)=>setStopForm({...stopForm, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={t(lang,'stop_name')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(lang,'latitude')} *</label>
                  <input
                    type="number" step="0.000001"
                    value={stopForm.lat}
                    onChange={(e)=>setStopForm({...stopForm, lat: e.target.value})}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="21.027763"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t(lang,'longitude')} *</label>
                  <input
                    type="number" step="0.000001"
                    value={stopForm.lng}
                    onChange={(e)=>setStopForm({...stopForm, lng: e.target.value})}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="105.834160"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!stopForm.is_pickup} onChange={(e)=>setStopForm({...stopForm, is_pickup: e.target.checked})} />
                  {t(lang,'is_pickup_stop')}
                </label>
                <button
                  onClick={async ()=>{
                    if (!stopForm.name.trim() || stopForm.lat === '' || stopForm.lng === ''){
                      alert(t(lang,'enter_valid_stop_fields'))
                      return
                    }
                    try{
                      const payload = {
                        name: stopForm.name.trim(),
                        lat: parseFloat(stopForm.lat),
                        lng: parseFloat(stopForm.lng),
                        is_pickup: !!stopForm.is_pickup
                      }
                      await addRouteStop(selectedRoute.id, payload)
                      const full = await getRoute(selectedRoute.id)
                      setStops(full?.stops || [])
                      setStopForm({ name: '', lat: '', lng: '', is_pickup: true })
                    }catch(e){
                      console.error('Add stop failed', e)
                      alert(t(lang,'add_stop_failed'))
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {t(lang,'add_stop')}
                </button>
              </div>
            </div>

            {/* Stops list */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">{t(lang,'stops_list')} ({stops.length})</div>
              {sortedStops.length === 0 ? (
                <div className="p-6 text-gray-500 dark:text-gray-400">{t(lang,'no_stops_yet_for_route')}</div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-200">{t(lang,'order')}</th>
                        <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-200">{t(lang,'name')}</th>
                        <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-200">Lat</th>
                        <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-200">Lng</th>
                        <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-200">{t(lang,'type')}</th>
                        <th className="text-right px-4 py-2 text-gray-700 dark:text-gray-200">{t(lang,'actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedStops.map((s, idx)=>(
                        <tr key={s.id} className="border-t border-gray-200 dark:border-gray-700 align-top">
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-6 text-center font-medium text-gray-800 dark:text-gray-100">{s.stop_order}</span>
                              <div className="flex flex-col gap-1">
                                <button title={t(lang,'up')} onClick={()=>moveStopUp(s)} disabled={idx===0} className={`px-2 py-0.5 rounded ${idx===0?'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500':'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-100'}`}>▲</button>
                                <button title={t(lang,'down')} onClick={()=>moveStopDown(s)} disabled={idx===sortedStops.length-1} className={`px-2 py-0.5 rounded ${idx===sortedStops.length-1?'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500':'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-100'}`}>▼</button>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            {editingStopId === s.id ? (
                              <input value={editingStopData.name} onChange={e=>setEditingStopData(d=>({...d, name: e.target.value}))} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            ) : (
                              <span className="text-gray-800 dark:text-gray-100">{s.name}</span>
                            )}
                          </td>
                          <td className="px-4 py-2 font-mono text-gray-800 dark:text-gray-100">
                            {editingStopId === s.id ? (
                              <input type="number" step="0.000001" value={editingStopData.lat} onChange={e=>setEditingStopData(d=>({...d, lat: e.target.value}))} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            ) : (
                              s.lat
                            )}
                          </td>
                          <td className="px-4 py-2 font-mono text-gray-800 dark:text-gray-100">
                            {editingStopId === s.id ? (
                              <input type="number" step="0.000001" value={editingStopData.lng} onChange={e=>setEditingStopData(d=>({...d, lng: e.target.value}))} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            ) : (
                              s.lng
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {editingStopId === s.id ? (
                              <label className="inline-flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={!!editingStopData.is_pickup} onChange={e=>setEditingStopData(d=>({...d, is_pickup: e.target.checked}))} />
                                {t(lang,'is_pickup_stop')}
                              </label>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-xs ${s.is_pickup ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                                {s.is_pickup ? t(lang,'pickup') : t(lang,'dropoff')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {editingStopId === s.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={cancelEditStop} className="px-2 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200">{t(lang,'cancel_button')}</button>
                                <button onClick={saveEditStop} className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">{t(lang,'save')}</button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={()=>startEditStop(s)} className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800/40">{t(lang,'edit_item')}</button>
                                <button
                                  onClick={async ()=>{
                                    if (!confirm(t(lang,'confirm_delete_stop'))) return
                                    try{
                                      await deleteRouteStop(selectedRoute.id, s.id)
                                      setStops(prev => prev.filter(x => x.id !== s.id))
                                    }catch(e){
                                      console.error('Delete stop failed', e)
                                      alert(t(lang,'delete_failed'))
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800/40"
                                >
                                  {t(lang,'delete')}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
