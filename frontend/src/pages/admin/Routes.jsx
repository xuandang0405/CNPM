import React, { useState, useEffect } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { Modal } from '../../components/common/Modal'
import { listRoutes, createRoute, updateRoute, deleteRoute } from '../../api/routes'
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
      setError('Lỗi tải danh sách tuyến đường')
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

  function closeModal() {
    setModalOpen(false)
    setEditingRoute(null)
    setFormData({ name: '' })
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <span className="text-3xl">🗺️</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold">Quản lý tuyến đường</h2>
                <p className="text-purple-100 mt-1">Tổng số: {routes.length} tuyến</p>
              </div>
            </div>
            <button 
              className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors font-medium shadow-lg flex items-center gap-2 disabled:opacity-50" 
              onClick={openAddModal}
              disabled={loading}
            >
              <span>➕</span> Thêm tuyến đường
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Routes Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-500">Đang tải danh sách tuyến đường...</p>
            </div>
          ) : routes.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">🗺️</span>
              <p className="text-gray-500 text-lg mb-2">Chưa có tuyến đường nào trong hệ thống</p>
              <p className="text-gray-400 text-sm">Nhấn nút "Thêm tuyến đường" để thêm tuyến đầu tiên</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ID</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Tên tuyến</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Số điểm dừng</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-gray-600 font-mono text-sm">#{route.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {route.name?.charAt(0)?.toUpperCase() || 'R'}
                          </div>
                          <span className="font-medium text-gray-800">{route.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          <span>📍</span> {route.stops?.length || 0} điểm
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(route)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(route)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            🗑️ Xóa
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

      <Modal open={modalOpen} title={editingRoute ? 'Sửa tuyến đường' : 'Thêm tuyến đường'} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên tuyến *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="VD: Tuyến 01 - Tây Hồ"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              disabled={submitting}
            >
              {submitting ? 'Đang xử lý...' : 'Lưu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
