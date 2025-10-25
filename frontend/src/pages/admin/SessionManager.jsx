import React from 'react'
import { useUserStore } from '../../store/useUserStore'
import { useNavigate } from 'react-router-dom'

export default function SessionManager(){
  const { user, clearUser } = useUserStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      clearUser()
      navigate('/login')
    }
  }

  const getRoleInfo = (role) => {
    const roles = {
      admin: { icon: '👑', name: 'Quản trị viên', color: 'from-red-500 to-pink-500', bg: 'bg-red-50', text: 'text-red-800' },
      driver: { icon: '🚗', name: 'Tài xế', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-800' },
      parent: { icon: '👨‍👩‍👧', name: 'Phụ huynh', color: 'from-green-500 to-teal-500', bg: 'bg-green-50', text: 'text-green-800' }
    }
    return roles[role] || { icon: '👤', name: role, color: 'from-gray-500 to-gray-600', bg: 'bg-gray-50', text: 'text-gray-800' }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <span className="text-3xl">🔐</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold">Quản lý phiên đăng nhập</h2>
              <p className="text-indigo-100 mt-1">Thông tin tài khoản hiện tại</p>
            </div>
          </div>
        </div>

        {/* Session Info */}
        {user ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* User Header */}
            <div className={`bg-gradient-to-r ${getRoleInfo(user.role).color} p-6 text-white`}>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-5xl">
                  {getRoleInfo(user.role).icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{user.full_name || user.username || user.email}</h3>
                  <p className="text-white/80 mt-1">{getRoleInfo(user.role).name}</p>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Tên đăng nhập</div>
                  <div className="text-lg font-semibold text-gray-800">{user.username || 'N/A'}</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Email</div>
                  <div className="text-lg font-semibold text-gray-800">{user.email || 'N/A'}</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Vai trò</div>
                  <div>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getRoleInfo(user.role).bg} ${getRoleInfo(user.role).text} font-semibold`}>
                      <span className="text-xl">{getRoleInfo(user.role).icon}</span>
                      {getRoleInfo(user.role).name}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">ID người dùng</div>
                  <div className="text-lg font-mono font-semibold text-gray-800">#{user.id || 'N/A'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={handleLogout}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <span>🚪</span> Đăng xuất
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <span className="text-6xl mb-4 block">🔒</span>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Chưa đăng nhập</h3>
            <p className="text-gray-600 mb-6">Vui lòng đăng nhập để tiếp tục</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg"
            >
              Đi đến trang đăng nhập
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
