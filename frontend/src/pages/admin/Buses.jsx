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
    if (!window.confirm(t(lang,'confirm_delete_bus'))) return
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <span className="text-3xl">🚌</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold">{t(lang,'buses_page_title')}</h2>
                <p className="text-blue-100 mt-1">{t(lang,'buses_total_label')}: {buses.length}</p>
              </div>
            </div>
            <button 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium shadow-lg flex items-center gap-2 disabled:opacity-50" 
              onClick={openAddModal}
              disabled={loading}
            >
              <span>➕</span> {t(lang,'add_bus_button')}
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

        {/* Buses Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-500 dark:text-gray-400">{t(lang,'loading_list')}</p>
            </div>
          ) : buses.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">🚌</span>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{t(lang,'no_buses')}</p>
              <p className="text-gray-400 text-sm">{t(lang,'add_bus_button')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">ID</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">{t(lang,'license_plate')}</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">{t(lang,'capacity')}</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">{t(lang,'actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {buses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-gray-600 dark:text-gray-300 font-mono text-sm">#{bus.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-xl">
                            🚌
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-100 font-mono">{bus.plate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium">
                          <span>👥</span> {bus.capacity} {t(lang,'seats')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(bus)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                          >
                            ✏️ {t(lang,'edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(bus)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                          >
                            🗑️ {t(lang,'delete')}
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

      <Modal open={modalOpen} title={editingBus ? `${t(lang,'edit')} ${t(lang,'bus')}` : t(lang,'add_bus_button')} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t(lang,'license_plate')} *</label>
            <input
              type="text"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="VD: 30A-12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t(lang,'capacity')} ({t(lang,'seats')}) *</label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
              disabled={submitting}
            >
              {t(lang,'cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
              disabled={submitting}
            >
              {submitting ? t(lang,'loading') : t(lang,'save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
