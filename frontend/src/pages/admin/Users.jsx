import React, { useEffect, useState } from 'react'
import { adminListUsers, adminDeleteUser } from '../../api/admin'
import { useUserStore } from '../../store/useUserStore'
import { useNavigate } from 'react-router-dom'

export default function AdminUsers(){
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const { user } = useUserStore()
  const navigate = useNavigate()

  useEffect(()=>{ load() }, [])
  async function load(){
    setLoading(true); setError(null)
    try{
      const data = await adminListUsers()
      setUsers(data.users || [])
    }catch(e){ setError(e && e.error ? e.error : 'Không thể tải danh sách người dùng') }
    setLoading(false)
  }

  async function onDelete(id, email){
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${email}"?`)) return
    try{ 
      await adminDeleteUser(id)
      setUsers(u => u.filter(x=>x.id!==id))
    }catch(e){ 
      alert('Xóa thất bại: '+(e.error || e.message || 'Lỗi không xác định')) 
    }
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  // Count by role
  const roleCount = {
    admin: users.filter(u => u.role === 'admin').length,
    driver: users.filter(u => u.role === 'driver').length,
    parent: users.filter(u => u.role === 'parent').length
  }

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      driver: 'bg-blue-100 text-blue-800 border-blue-200',
      parent: 'bg-green-100 text-green-800 border-green-200'
    }
    const icons = {
      admin: '👑',
      driver: '🚗',
      parent: '👨‍👩‍👧'
    }
    const labels = {
      admin: 'Quản trị viên',
      driver: 'Tài xế',
      parent: 'Phụ huynh'
    }
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${badges[role] || 'bg-gray-100 text-gray-800'}`}>
        <span>{icons[role] || '👤'}</span>
        {labels[role] || role}
      </span>
    )
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg border border-red-200">
          <div className="text-center">
            <span className="text-6xl">🔒</span>
            <h3 className="text-xl font-bold text-gray-800 mt-4">Không có quyền truy cập</h3>
            <p className="text-gray-600 mt-2">Bạn cần đăng nhập với quyền Admin để xem trang này.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span>👥</span> Quản lý người dùng
              </h2>
              <p className="text-gray-500 mt-1">Tổng số: {users.length} người dùng</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>➕</span> Thêm người dùng
              </button>
              <button 
                onClick={load}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <span>🔄</span> {loading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Quản trị viên</p>
                  <p className="text-2xl font-bold text-red-700">{roleCount.admin}</p>
                </div>
                <span className="text-4xl">👑</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Tài xế</p>
                  <p className="text-2xl font-bold text-blue-700">{roleCount.driver}</p>
                </div>
                <span className="text-4xl">🚗</span>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Phụ huynh</p>
                  <p className="text-2xl font-bold text-green-700">{roleCount.parent}</p>
                </div>
                <span className="text-4xl">👨‍👩‍👧</span>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Tìm kiếm theo email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">🌐 Tất cả vai trò</option>
              <option value="admin">👑 Quản trị viên</option>
              <option value="driver">🚗 Tài xế</option>
              <option value="parent">👨‍👩‍👧 Phụ huynh</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-500">Đang tải danh sách người dùng...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">🔍</span>
              <p className="text-gray-500 text-lg">
                {searchTerm || filterRole !== 'all' 
                  ? 'Không tìm thấy người dùng phù hợp' 
                  : 'Chưa có người dùng nào trong hệ thống'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Vai trò
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => onDelete(u.id, u.email)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center gap-2 mx-auto"
                        >
                          <span>🗑️</span> Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {filteredUsers.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Hiển thị {filteredUsers.length} / {users.length} người dùng
          </div>
        )}
      </div>
    </div>
  )
}
