import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axios'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import { Send, Bell, Users, User, AlertCircle, Info, CheckCircle, UserCheck, UsersRound } from 'lucide-react'

export default function AdminNotifications(){
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('info')
  const [priority, setPriority] = useState('medium')
  const [targetRole, setTargetRole] = useState('parent')
  const [sendMode, setSendMode] = useState('all') // 'all', 'specific'
  const [selectedUsers, setSelectedUsers] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { lang, user, clearUser } = useUserStore()
  
  // Check if user has permission
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'driver')) {
      setError('⚠️ Bạn không có quyền gửi thông báo. Vui lòng đăng nhập bằng tài khoản admin hoặc driver.')
      // Auto logout and redirect after 3 seconds
      const timer = setTimeout(() => {
        clearUser()
        navigate('/login')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [user, navigate, clearUser])

  useEffect(()=>{ load() }, [])

  // Load users when target role changes
  useEffect(() => {
    if (sendMode === 'specific') {
      loadUsers()
    }
  }, [targetRole, sendMode])

  async function load() {
    try {
      setLoading(true)
      const { data } = await axiosInstance.get('/notifications')
      const notifList = Array.isArray(data) ? data : (data?.notifications || [])
      setItems(notifList)
      setError('')
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setItems([])
      setError('Lỗi tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers() {
    try {
      setLoadingUsers(true)
      const endpoint = targetRole === 'parent' ? '/admin/users?role=parent' : '/admin/drivers'
      const { data } = await axiosInstance.get(endpoint)
      
      if (targetRole === 'parent') {
        setAvailableUsers(data.users || [])
      } else if (targetRole === 'driver') {
        // Map drivers to user format
        const driverUsers = (data.drivers || []).map(d => ({
          id: d.user_id,
          full_name: d.full_name,
          email: d.phone
        }))
        setAvailableUsers(driverUsers)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
      setAvailableUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  function toggleUserSelection(userId) {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  function selectAllUsers() {
    setSelectedUsers(availableUsers.map(u => u.id))
  }

  function clearSelection() {
    setSelectedUsers([])
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung')
      return
    }

    if (sendMode === 'specific' && selectedUsers.length === 0) {
      setError('Vui lòng chọn ít nhất một người nhận')
      return
    }

    try {
      setSending(true)
      setError('')
      setSuccess('')
      
      const payload = {
        title,
        body,
        type,
        priority
      }

      if (sendMode === 'all') {
        // Send to all users of target role
        payload.target_role = targetRole
      } else {
        // Send to specific users
        payload.target_users = selectedUsers
      }

      await axiosInstance.post('/notifications/send', payload)
      
      setTitle('')
      setBody('')
      setSelectedUsers([])
      
      const count = sendMode === 'all' ? 'tất cả' : selectedUsers.length
      const roleName = targetRole === 'parent' ? 'phụ huynh' : targetRole === 'driver' ? 'tài xế' : 'người dùng'
      setSuccess(`✅ Đã gửi thông báo đến ${count} ${roleName}`)
      setTimeout(() => setSuccess(''), 3000)
      load()
    } catch (err) {
      console.error('Failed to send notification:', err)
      
      // Handle 403 Forbidden specifically
      if (err.response?.status === 403) {
        const detail = err.response?.data?.detail || ''
        setError(`🔒 Không có quyền: ${detail}. Vui lòng đăng nhập bằng tài khoản admin hoặc driver.`)
        
        // Auto logout and redirect after 3 seconds
        setTimeout(() => {
          clearUser()
          navigate('/login')
        }, 3000)
      } else if (err.response?.status === 401) {
        setError('🔑 Token hết hạn. Vui lòng đăng nhập lại.')
        setTimeout(() => {
          clearUser()
          navigate('/login')
        }, 2000)
      } else {
        setError(err.response?.data?.error || '❌ Lỗi gửi thông báo')
      }
    } finally {
      setSending(false)
    }
  }

  const typeOptions = [
    { value: 'info', label: 'Thông tin', icon: Info, color: 'blue' },
    { value: 'alert', label: 'Cảnh báo', icon: AlertCircle, color: 'red' },
    { value: 'success', label: 'Thành công', icon: CheckCircle, color: 'green' },
  ]

  const priorityOptions = [
    { value: 'low', label: 'Thấp', color: 'gray' },
    { value: 'medium', label: 'Trung bình', color: 'yellow' },
    { value: 'high', label: 'Cao', color: 'red' },
  ]

  return (
    <div className="space-y-6">
      {/* Send Notification Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Send className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Gửi Thông Báo</h2>
          </div>
        </div>
        
        <div className="p-6">
          {/* Permission Warning */}
          {user && user.role !== 'admin' && user.role !== 'driver' && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    ⚠️ Cảnh báo: Bạn không có quyền gửi thông báo
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Role hiện tại: <strong>{user.role}</strong>
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Chỉ <strong>admin</strong> hoặc <strong>driver</strong> mới có thể gửi thông báo.
                  </p>
                  <button
                    onClick={() => {
                      clearUser()
                      navigate('/login')
                    }}
                    className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Đăng xuất và đăng nhập lại
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">{success}</span>
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }} className="space-y-4">
            {/* Target Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gửi đến
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetRole('parent')}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                    targetRole === 'parent' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Users className={`w-5 h-5 ${targetRole === 'parent' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`text-sm ${targetRole === 'parent' ? 'text-blue-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                    Phụ huynh
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setTargetRole('driver')}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                    targetRole === 'driver' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <User className={`w-5 h-5 ${targetRole === 'driver' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`text-sm ${targetRole === 'driver' ? 'text-blue-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                    Tài xế
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setTargetRole('all')}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                    targetRole === 'all' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Bell className={`w-5 h-5 ${targetRole === 'all' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`text-sm ${targetRole === 'all' ? 'text-blue-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                    Tất cả
                  </span>
                </button>
              </div>
            </div>

            {/* Send Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chế độ gửi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSendMode('all')
                    setSelectedUsers([])
                  }}
                  className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                    sendMode === 'all' 
                      ? 'border-green-600 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <UsersRound className={`w-5 h-5 ${sendMode === 'all' ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className={`text-sm ${sendMode === 'all' ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                    Gửi cho tất cả
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSendMode('specific')}
                  className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                    sendMode === 'specific' 
                      ? 'border-green-600 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <UserCheck className={`w-5 h-5 ${sendMode === 'specific' ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className={`text-sm ${sendMode === 'specific' ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                    Chọn người nhận
                  </span>
                </button>
              </div>
            </div>

            {/* User Selection (only when sendMode === 'specific') */}
            {sendMode === 'specific' && (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Chọn người nhận ({selectedUsers.length} đã chọn)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllUsers}
                      className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>
                
                {loadingUsers ? (
                  <div className="text-center py-4 text-gray-500">Đang tải danh sách...</div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">Không có người dùng nào</div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {availableUsers.map(user => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại thông báo
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mức độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiêu đề
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nhập tiêu đề thông báo"
                disabled={sending}
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nội dung
              </label>
              <textarea 
                value={body} 
                onChange={e=>setBody(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                placeholder="Nhập nội dung thông báo" 
                disabled={sending}
                rows="4"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-400 font-medium flex items-center justify-center gap-2 transition-all" 
              disabled={sending || !title.trim() || !body.trim() || !user || (user.role !== 'admin' && user.role !== 'driver')}
            >
              <Send className="w-5 h-5" />
              {sending ? 'Đang gửi...' : user && (user.role !== 'admin' && user.role !== 'driver') ? '🔒 Không có quyền' : 'Gửi thông báo'}
            </button>
          </form>
        </div>
      </div>

      {/* Notifications History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Lịch sử thông báo</h2>
          </div>
        </div>
        
        <div className="p-6">
          {loading && <div className="text-gray-600 dark:text-gray-400">Đang tải...</div>}
          {items.length === 0 && !loading && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Chưa có thông báo nào</p>
          )}
          <div className="space-y-3">
            {items.map(n => (
              <div key={n.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{n.title}</h3>
                      {n.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                          Quan trọng
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{n.body}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                      <span>{new Date(n.created_at).toLocaleString('vi-VN')}</span>
                      <span>•</span>
                      <span>Gửi đến: {n.target_role === 'parent' ? 'Phụ huynh' : n.target_role === 'driver' ? 'Tài xế' : 'Tất cả'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
