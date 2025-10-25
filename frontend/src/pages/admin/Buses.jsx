import React, { useEffect, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { Modal } from '../../components/common/Modal'
import { listBuses, createBus, updateBus, deleteBus } from '../../api/buses'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import { TableSkeleton } from '../../components/common/Skeleton'
import { DataError, EmptyState } from '../../components/common/ErrorBoundary'

export default function Buses() {
  const { lang } = useUserStore()
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBus, setEditingBus] = useState(null)
  const [formData, setFormData] = useState({ plate: '', capacity: 20 })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      setError('')
      const data = await listBuses()
      const busesList = Array.isArray(data) ? data : (data?.buses || [])
      setBuses(busesList)
    } catch (err) {
      console.error('Failed to load buses:', err)
      setBuses([])
      setError(err.response?.data?.message || err.message || 'Không thể kết nối với server. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingBus(null)
    setFormData({ plate: '', capacity: 20 })
    setModalOpen(true)
  }

  function openEditModal(row) {
    setEditingBus(row)
    setFormData({ plate: row.plate || '', capacity: row.capacity || 20 })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingBus(null)
    setFormData({ plate: '', capacity: 20 })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.plate.trim()) {
      setError('Vui lòng nhập biển số xe')
      return
    }
    
    try {
      setSubmitting(true)
      if (editingBus) {
        await updateBus(editingBus.id, formData)
      } else {
        await createBus(formData)
      }
      closeModal()
      load()
    } catch (err) {
      setError(editingBus ? 'Lỗi cập nhật xe buýt' : 'Lỗi thêm xe buýt')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(row) {
    if (!window.confirm('Bạn có chắc muốn xóa xe này?')) return
    try {
      await deleteBus(row.id)
      load()
    } catch (err) {
      console.error('Failed to delete bus:', err)
      setError('Lỗi xóa xe buýt')
    }
  }

  const cols = [ 
    { key: 'id', title: t(lang,'id') || 'ID' }, 
    { key: 'plate', title: t(lang,'plate') || 'Plate' }, 
    { key: 'capacity', title: t(lang,'capacity') || 'Capacity' } 
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <span className="text-3xl">🚌</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold">Quản lý xe buýt</h2>
                <p className="text-blue-100 mt-1">Tổng số: {buses.length} xe</p>
              </div>
            </div>
            <button 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium shadow-lg flex items-center gap-2 disabled:opacity-50" 
              onClick={openAddModal}
              disabled={loading}
            >
              <span>➕</span> Thêm xe buýt
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

        {/* Buses Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-500">Đang tải danh sách xe buýt...</p>
            </div>
          ) : buses.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">🚌</span>
              <p className="text-gray-500 text-lg mb-2">Chưa có xe buýt nào trong hệ thống</p>
              <p className="text-gray-400 text-sm">Nhấn nút "Thêm xe buýt" để thêm xe đầu tiên</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">ID</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Biển số xe</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Sức chứa</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {buses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-gray-600 font-mono text-sm">#{bus.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-xl">
                            🚌
                          </div>
                          <span className="font-medium text-gray-800 font-mono">{bus.plate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          <span>👥</span> {bus.capacity} chỗ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(bus)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(bus)}
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

      <Modal open={modalOpen} title={editingBus ? 'Sửa xe buýt' : 'Thêm xe buýt'} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Biển số xe *</label>
            <input
              type="text"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="VD: 30A-12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sức chứa (ghế) *</label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
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
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
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
