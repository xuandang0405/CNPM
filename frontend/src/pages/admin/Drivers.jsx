import React, { useState, useEffect } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { Modal } from '../../components/common/Modal'
import { listDrivers, createDriver, updateDriver, deleteDriver } from '../../api/drivers'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import { TableSkeleton } from '../../components/common/Skeleton'
import axiosInstance from '../../api/axios'

export default function Drivers() {
    const { lang } = useUserStore()
    const [drivers, setDrivers] = useState([])
    const [buses, setBuses] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [editingDriver, setEditingDriver] = useState(null)
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        license_number: '',
        bus_id: ''
    })
    const [submitting, setSubmitting] = useState(false)
    
    useEffect(() => { 
        load()
        loadBuses()
    }, [])

    async function load() { 
        try {
            setLoading(true)
            console.log('Loading drivers...')
            const data = await listDrivers()
            console.log('Raw drivers data:', data)
            const driversList = Array.isArray(data) ? data : (data?.drivers || [])
            console.log('Processed drivers list:', driversList)
            setDrivers(driversList)
            setError('')
        } catch (e) {
            console.error('Failed to load drivers', e)
            setDrivers([])
            setError('Lỗi tải danh sách tài xế: ' + (e?.message || e?.error || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    async function loadBuses() {
        try {
            const response = await axiosInstance.get('/admin/buses')
            const busesList = response.data?.buses || []
            setBuses(busesList)
        } catch (e) {
            console.error('Failed to load buses', e)
            setBuses([])
        }
    }

    function openAddModal() {
        setEditingDriver(null)
        setFormData({ 
            full_name: '', 
            email: '',
            phone: '', 
            password: '',
            license_number: '',
            bus_id: ''
        })
        setModalOpen(true)
    }

    function openEditModal(row) {
        setEditingDriver(row)
        setFormData({ 
            full_name: row.full_name || '', 
            email: row.email || '',
            phone: row.phone || '',
            password: '', // Don't pre-fill password for edit
            license_number: row.license_number || '',
            bus_id: row.bus_id || ''
        })
        setModalOpen(true)
    }

    function closeModal() {
        setModalOpen(false)
        setEditingDriver(null)
        setFormData({ 
            full_name: '', 
            email: '',
            phone: '', 
            password: '',
            license_number: '',
            bus_id: ''
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        
        // Validate required fields
        if (!formData.full_name?.trim()) {
            setError('Vui lòng nhập họ tên')
            return
        }
        if (!formData.phone?.trim()) {
            setError('Vui lòng nhập số điện thoại')
            return
        }
        
        // Email and password required for new drivers only
        if (!editingDriver) {
            if (!formData.email?.trim()) {
                setError('Vui lòng nhập email')
                return
            }
            if (!formData.password?.trim()) {
                setError('Vui lòng nhập mật khẩu')
                return
            }
            if (formData.password.length < 6) {
                setError('Mật khẩu phải có ít nhất 6 ký tự')
                return
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email)) {
                setError('Email không hợp lệ')
                return
            }
        }

        try {
            setSubmitting(true)
            setError('')
            
            const submitData = { 
                full_name: formData.full_name.trim(),
                phone: formData.phone.trim(),
                license_number: formData.license_number?.trim() || null,
                bus_id: formData.bus_id || null
            }
            
            // Include email and password for new drivers
            if (!editingDriver) {
                submitData.email = formData.email.trim()
                submitData.password = formData.password
            } else {
                // Include email for updates if changed
                if (formData.email?.trim()) {
                    submitData.email = formData.email.trim()
                }
            }
            
            console.log('Form: Submitting driver data:', submitData)
            console.log('Form: Edit mode:', !!editingDriver)
            
            if (editingDriver) {
                console.log('Form: Updating driver ID:', editingDriver.id)
                const result = await updateDriver(editingDriver.id, submitData)
                console.log('Form: Update result:', result)
            } else {
                console.log('Form: Creating new driver')
                const result = await createDriver(submitData)
                console.log('Form: Create result:', result)
            }
            
            console.log('Form: Submission successful, closing modal and reloading')
            closeModal()
            await load()
        } catch (error) {
            console.error('Form: Submit error:', error)
            const errorMsg = error?.error || error?.message || 'Lỗi không xác định'
            setError(editingDriver ? `Lỗi cập nhật tài xế: ${errorMsg}` : `Lỗi thêm tài xế: ${errorMsg}`)
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(row) { 
        if (!window.confirm(t(lang,'confirm_delete_driver'))) {
            return
        }
        try {
            setError('')
            console.log('Form: Deleting driver ID:', row.id)
            const result = await deleteDriver(row.id)
            console.log('Form: Delete result:', result)
            console.log('Form: Delete successful, reloading data')
            await load()
        } catch (error) {
            console.error('Form: Delete error:', error)
            const errorMsg = error?.error || error?.message || 'Lỗi không xác định'
            setError(`Lỗi xóa tài xế: ${errorMsg}`)
        }
    }

    // Cột hiển thị
    const cols = [ 
        { key: 'id', title: t(lang,'id') || 'ID' }, 
        { key: 'full_name', title: t(lang,'name') || 'Họ tên' },
        { key: 'email', title: 'Email' },
        { key: 'phone', title: t(lang,'phone') || 'Số điện thoại' },
        { key: 'license_number', title: 'Số bằng lái' },
        { 
            key: 'bus_plate', 
            title: 'Xe được giao', 
            render: (row) => row.bus_plate || '—'
        },
        { 
            key: 'active', 
            title: t(lang,'active') || 'Trạng thái', 
            render: (row) => row.active ? '✅ Hoạt động' : '❌ Không hoạt động'
        } 
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                                <span className="text-3xl">🚗</span>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">{t(lang,'drivers_page_title')}</h2>
                                <p className="text-green-100 mt-1">{t(lang,'drivers_total_label')}: {drivers.length}</p>
                            </div>
                        </div>
                        <button 
                            className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors font-medium shadow-lg flex items-center gap-2 disabled:opacity-50" 
                            onClick={openAddModal}
                            disabled={loading}
                        >
                            <span>➕</span> {t(lang,'add_driver_button')}
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{t(lang,'drivers_total_label')}</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{drivers.length}</p>
                            </div>
                            <span className="text-4xl">👨‍✈️</span>
                        </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 dark:text-green-300 font-medium">{t(lang,'active_drivers')}</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {drivers.filter(d => d.active).length}
                                </p>
                            </div>
                            <span className="text-4xl">✅</span>
                        </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">{t(lang,'drivers_with_bus')}</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {drivers.filter(d => d.bus_id).length}
                                </p>
                            </div>
                            <span className="text-4xl">🚌</span>
                        </div>
                    </div>
                </div>

                {/* Drivers Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
                            <p className="text-gray-500">{t(lang,'loading_list')}</p>
                        </div>
                    ) : drivers.length === 0 ? (
                        <div className="p-12 text-center">
                            <span className="text-6xl mb-4 block">🚗</span>
                            <p className="text-gray-500 text-lg mb-2">{t(lang,'no_drivers_yet')}</p>
                            <p className="text-gray-400 text-sm">{t(lang,'add_driver_button')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'driver_label')}</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'contact')}</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Bằng lái</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'assigned_bus')}</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'driver_status')}</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {drivers.map((driver) => (
                                        <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {driver.full_name?.charAt(0)?.toUpperCase() || 'D'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-800 dark:text-gray-100">{driver.full_name}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{driver.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    📞 {driver.phone || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-mono text-gray-700 dark:text-gray-200">
                                                    {driver.license_number || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {driver.bus_plate ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                                                        <span>🚌</span> {driver.bus_plate}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500 text-sm">{t(lang,'no_bus')}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {driver.active ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-full text-xs font-medium">
                                                        <span>✅</span> {t(lang,'active')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-medium">
                                                        <span>❌</span> {t(lang,'inactive')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(driver)}
                                                        className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
                                                    >
                                                        ✏️ {t(lang,'edit')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(driver)}
                                                        className="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
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

            <Modal open={modalOpen} title={editingDriver ? `${t(lang,'edit')} ${t(lang,'driver_label')}` : t(lang,'add_driver_button')} onClose={closeModal}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t(lang,'full_name')} *</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                            placeholder="VD: Nguyễn Văn A"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                            Email {!editingDriver && '*'}
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                            placeholder="VD: driver@example.com"
                            disabled={editingDriver} // Disable email edit for existing drivers
                        />
                        {editingDriver && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email không thể thay đổi sau khi tạo</p>
                        )}
                    </div>
                    
                    {!editingDriver && (
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t(lang,'password')} *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                placeholder="Tối thiểu 6 ký tự"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t(lang,'phone')} *</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                            placeholder="VD: 0908123456"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">Số bằng lái</label>
                        <input
                            type="text"
                            value={formData.license_number}
                            onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                            placeholder="VD: B123456789"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">{t(lang,'assigned_bus')}</label>
                        <select
                            value={formData.bus_id}
                            onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                        >
                            <option value="">-- {t(lang,'no_bus')} --</option>
                            {buses
                                .filter(bus => !bus.driver_id || (editingDriver && bus.driver_id === editingDriver.id))
                                .map(bus => (
                                    <option key={bus.id} value={bus.id}>
                                        {bus.plate} - {bus.capacity} chỗ
                                        {bus.driver_name && bus.driver_id !== editingDriver?.id ? ` (Đã có: ${bus.driver_name})` : ''}
                                    </option>
                                ))
                            }
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(lang,'select_bus')}</p>
                    </div>
                    
                    <div className="flex gap-2 justify-end pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
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