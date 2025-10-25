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
        if (!window.confirm(`Bạn có chắc muốn xóa tài xế ${row.full_name}?`)) {
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                                <span className="text-3xl">🚗</span>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">Quản lý tài xế</h2>
                                <p className="text-green-100 mt-1">Tổng số: {drivers.length} tài xế</p>
                            </div>
                        </div>
                        <button 
                            className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors font-medium shadow-lg flex items-center gap-2 disabled:opacity-50" 
                            onClick={openAddModal}
                            disabled={loading}
                        >
                            <span>➕</span> Thêm tài xế
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Tổng tài xế</p>
                                <p className="text-2xl font-bold text-gray-800">{drivers.length}</p>
                            </div>
                            <span className="text-4xl">👨‍✈️</span>
                        </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium">Đang hoạt động</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {drivers.filter(d => d.active).length}
                                </p>
                            </div>
                            <span className="text-4xl">✅</span>
                        </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Đã có xe</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {drivers.filter(d => d.bus_id).length}
                                </p>
                            </div>
                            <span className="text-4xl">🚌</span>
                        </div>
                    </div>
                </div>

                {/* Drivers Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
                            <p className="text-gray-500">Đang tải danh sách tài xế...</p>
                        </div>
                    ) : drivers.length === 0 ? (
                        <div className="p-12 text-center">
                            <span className="text-6xl mb-4 block">🚗</span>
                            <p className="text-gray-500 text-lg mb-2">Chưa có tài xế nào trong hệ thống</p>
                            <p className="text-gray-400 text-sm">Nhấn nút "Thêm tài xế" để thêm tài xế đầu tiên</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Tài xế</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Liên hệ</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Bằng lái</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Xe được giao</th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Trạng thái</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {drivers.map((driver) => (
                                        <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {driver.full_name?.charAt(0)?.toUpperCase() || 'D'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-800">{driver.full_name}</div>
                                                        <div className="text-sm text-gray-500">{driver.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">
                                                    📞 {driver.phone || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-mono text-gray-700">
                                                    {driver.license_number || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {driver.bus_plate ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                                        <span>🚌</span> {driver.bus_plate}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Chưa có xe</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {driver.active ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-xs font-medium">
                                                        <span>✅</span> Hoạt động
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded-full text-xs font-medium">
                                                        <span>❌</span> Không hoạt động
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(driver)}
                                                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                                    >
                                                        ✏️ Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(driver)}
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

            <Modal open={modalOpen} title={editingDriver ? 'Sửa tài xế' : 'Thêm tài xế'} onClose={closeModal}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Họ tên *</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="VD: Nguyễn Văn A"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Email {!editingDriver && '*'}
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="VD: driver@example.com"
                            disabled={editingDriver} // Disable email edit for existing drivers
                        />
                        {editingDriver && (
                            <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi sau khi tạo</p>
                        )}
                    </div>
                    
                    {!editingDriver && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Mật khẩu *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Tối thiểu 6 ký tự"
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Số điện thoại *</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="VD: 0908123456"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Số bằng lái</label>
                        <input
                            type="text"
                            value={formData.license_number}
                            onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="VD: B123456789"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Xe được giao</label>
                        <select
                            value={formData.bus_id}
                            onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                        >
                            <option value="">-- Chưa giao xe --</option>
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
                        <p className="text-xs text-gray-500 mt-1">Chỉ hiển thị xe chưa được giao hoặc xe hiện tại của tài xế</p>
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