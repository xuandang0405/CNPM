import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axios'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import { Send, Bell, Users, User, AlertCircle, Info, CheckCircle, UserCheck, UsersRound, Trash2, Eye, Copy, Clock } from 'lucide-react'
import useNotifications from '../../hooks/useNotifications'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { useToast } from '../../components/common/ToastProvider'
import Modal from '../../components/common/Modal'

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
  const { unreadCount, markAsRead, deleteNotification, loadUnreadCount } = useNotifications()
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'
  const { addToast } = useToast()
  const [confirmState, setConfirmState] = useState({ open: false, title: '', description: '', onConfirm: null, variant: 'danger' })
  
  
  // Check if user has permission
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'driver')) {
      setError(`${t(lang,'permission_warning_title')}. ${t(lang,'only_admin_driver_can_send')}`)
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
      setError(t(lang,'load_list_failed_try_again'))
    } finally {
      setLoading(false)
    }
  }

  

  // Auto refresh with interval when enabled
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      load()
    }, 20000) // every 20s
    return () => clearInterval(id)
  }, [autoRefresh])

  const openDetail = async (n) => {
    setSelected(n)
    setDetailOpen(true)
    // Mark as read if unread
    if (!n.is_read) {
      try {
        await markAsRead(n.id)
        setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
        // refresh unread badge
        await loadUnreadCount()
      } catch (e) {
        console.error('Failed to mark as read:', e)
      }
    }
  }

  const removeOne = (id) => {
    setConfirmState({
      open: true,
      title: t(lang,'confirm_delete_notification'),
      description: '',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteNotification(id)
          setItems(prev => prev.filter(x => x.id !== id))
          await loadUnreadCount()
          addToast({ type: 'success', message: t(lang, 'delete') + ' OK' })
        } catch (e) {
          console.error('Failed to delete notification:', e)
          addToast({ type: 'error', message: t(lang,'delete_notification_failed') })
        } finally {
          setConfirmState(s => ({ ...s, open: false }))
        }
      }
    })
  }

  const markAllRead = async () => {
    try {
      await axiosInstance.put('/notifications/mark-all-read')
      setItems(prev => prev.map(x => ({ ...x, is_read: true })))
      await loadUnreadCount()
    } catch (e) {
      console.error('Failed to mark all read:', e)
      addToast({ type: 'error', message: t(lang,'mark_all_read_failed') })
    }
  }

  const cleanupRead = () => {
    setConfirmState({
      open: true,
      title: t(lang,'cleanup_read_confirm'),
      description: '',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await axiosInstance.delete('/notifications/cleanup-read')
          setItems(prev => prev.filter(x => !x.is_read))
          addToast({ type: 'success', message: t(lang, 'delete') + ' OK' })
        } catch (e) {
          console.error('Failed to cleanup read notifications:', e)
          addToast({ type: 'error', message: t(lang,'cleanup_read_failed') })
        } finally {
          setConfirmState(s => ({ ...s, open: false }))
        }
      }
    })
  }

  const markUnread = async (id) => {
    try {
      await axiosInstance.put(`/notifications/${id}`, { is_read: false })
      setItems(prev => prev.map(x => x.id === id ? { ...x, is_read: false } : x))
      await loadUnreadCount()
    } catch (e) {
      console.error('Failed to mark unread:', e)
      addToast({ type: 'error', message: t(lang,'mark_unread_failed') })
    }
  }

  const copyContent = async () => {
    try {
      if (!selected) return
      const text = `${selected.title}\n\n${selected.body}\n\n(${selected.created_at ? new Date(selected.created_at).toLocaleString(locale) : ''})`
      await navigator.clipboard.writeText(text)
      addToast({ type: 'success', message: t(lang,'copied_notification_content') })
    } catch (e) {
      console.error('Failed to copy notification', e)
      addToast({ type: 'error', message: t(lang,'copy_failed') })
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
      setError(t(lang,'please_fill_title_body'))
      return
    }

    if (sendMode === 'specific' && selectedUsers.length === 0) {
      setError(t(lang,'please_select_at_least_one'))
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
      
      const count = sendMode === 'all' ? t(lang,'all_lower') : selectedUsers.length
      const roleName = targetRole === 'parent' ? t(lang,'parent_lower') : targetRole === 'driver' ? t(lang,'driver_lower') : t(lang,'user_lower')
      setSuccess(`✅ ${t(lang,'sent_notification_to')} ${count} ${roleName}`)
      setTimeout(() => setSuccess(''), 3000)
      load()
    } catch (err) {
      console.error('Failed to send notification:', err)
      
      // Handle 403 Forbidden specifically
      if (err.response?.status === 403) {
        setError(t(lang,'session_expired_or_forbidden_admin'))
        
        // Auto logout and redirect after 3 seconds
        setTimeout(() => {
          clearUser()
          navigate('/login')
        }, 3000)
      } else if (err.response?.status === 401) {
        setError(t(lang,'session_expired_or_forbidden_admin'))
        setTimeout(() => {
          clearUser()
          navigate('/login')
        }, 2000)
      } else {
        setError(err.response?.data?.error || t(lang,'error'))
      }
    } finally {
      setSending(false)
    }
  }

  const typeOptions = [
    { value: 'info', label: t(lang,'info'), icon: Info, color: 'blue' },
    { value: 'alert', label: t(lang,'warning'), icon: AlertCircle, color: 'red' },
    { value: 'success', label: t(lang,'success'), icon: CheckCircle, color: 'green' },
  ]

  const priorityOptions = [
    { value: 'low', label: t(lang,'low'), color: 'gray' },
    { value: 'medium', label: t(lang,'medium'), color: 'yellow' },
    { value: 'high', label: t(lang,'high'), color: 'red' },
  ]

  return (
    <div className="space-y-6">
      {/* Send Notification Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Send className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">{t(lang,'send_notifications')}</h2>
          </div>
        </div>
        
        <div className="p-6">
          {/* Permission Warning */}
          {user && user.role !== 'admin' && user.role !== 'driver' && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">⚠️ {t(lang,'permission_warning_title')}</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    {t(lang,'current_role')}: <strong>{user.role}</strong>
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    {t(lang,'only_admin_driver_can_send')}
                  </p>
                  <button
                    onClick={() => {
                      clearUser()
                      navigate('/login')
                    }}
                    className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {t(lang,'logout_and_login')}
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
                {t(lang,'send_to')}
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
                  <span className={`text-sm ${targetRole === 'parent' ? 'text-blue-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{t(lang,'parents_label')}</span>
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
                  <span className={`text-sm ${targetRole === 'driver' ? 'text-blue-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{t(lang,'drivers_label')}</span>
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
                  <span className={`text-sm ${targetRole === 'all' ? 'text-blue-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{t(lang,'all_label')}</span>
                </button>
              </div>
            </div>

            {/* Send Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t(lang,'send_mode')}
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
                  <span className={`text-sm ${sendMode === 'all' ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{t(lang,'send_to_all')}</span>
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
                  <span className={`text-sm ${sendMode === 'specific' ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{t(lang,'choose_recipients')}</span>
                </button>
              </div>
            </div>

            {/* User Selection (only when sendMode === 'specific') */}
            {sendMode === 'specific' && (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t(lang,'select_recipients')} ({selectedUsers.length} {t(lang,'selected')})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllUsers}
                      className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      {t(lang,'select_all')}
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {t(lang,'clear_selection')}
                    </button>
                  </div>
                </div>
                
                {loadingUsers ? (
                  <div className="text-center py-4 text-gray-500">{t(lang,'loading_users_list')}</div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">{t(lang,'no_users')}</div>
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
                  {t(lang,'notification_type')}
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
                  {t(lang,'priority_level')}
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
                {t(lang,'title_label')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={t(lang,'title_placeholder')}
                disabled={sending}
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t(lang,'body_label')}
              </label>
              <textarea 
                value={body} 
                onChange={e=>setBody(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" 
                placeholder={t(lang,'body_placeholder')} 
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
              {sending ? t(lang,'sending') : user && (user.role !== 'admin' && user.role !== 'driver') ? `🔒 ${t(lang,'no_permission_short')}` : t(lang,'send_notification')}
            </button>
          </form>
        </div>
      </div>

      

      {/* Notifications History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">{t(lang,'notifications_history')}</h2>
            <span className="ml-auto text-white/90 text-sm">{t(lang,'unread_count_label')}: {unreadCount || 0}</span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={markAllRead} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">{t(lang,'mark_all_read')}</button>
            <button onClick={cleanupRead} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm">{t(lang,'delete_read')}</button>
            <button onClick={load} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm">{t(lang,'refresh_button')}</button>
            <label className="ml-auto inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} />
              {t(lang,'auto_refresh_20s_label')}
            </label>
          </div>
          {loading && <div className="text-gray-600 dark:text-gray-400">{t(lang,'loading')}</div>}
          {items.length === 0 && !loading && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t(lang,'no_notifications')}</p>
          )}
          <div className="space-y-3">
            {items.map(n => {
              const typeBorder = n.type === 'alert' ? 'border-l-red-400' : n.type === 'success' ? 'border-l-green-400' : 'border-l-blue-400'
              return (
              <div key={n.id} className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} border-l-4 ${typeBorder}`}>
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => openDetail(n)} className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{n.title}</h3>
                      {n.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                          {t(lang,'important')}
                        </span>
                      )}
                      {!n.is_read && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">{t(lang,'new_label')}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{n.body}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                      <span>{n.created_at ? new Date(n.created_at).toLocaleString(locale) : '-'}</span>
                      <span>•</span>
                      <span>{t(lang,'sent_to')}: {n.target_role === 'parent' ? t(lang,'parents_label') : n.target_role === 'driver' ? t(lang,'drivers_label') : t(lang,'all_label')}</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openDetail(n)} title={t(lang,'view_details')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button onClick={() => removeOne(n.id)} title={t(lang,'delete_label')} className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/30">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={detailOpen} title={selected?.title || t(lang,'notification_detail_title')} onClose={() => setDetailOpen(false)} size="md">
        {selected ? (
          <div className="space-y-4">
            {/* Header section with icon and badges */}
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${selected.type === 'alert' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300' : selected.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                {selected.type === 'alert' ? <AlertCircle className="w-5 h-5" /> : selected.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {selected.priority === 'high' && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs rounded-full">{t(lang,'important')}</span>
                  )}
                  {selected.type && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">{selected.type}</span>
                  )}
                  <span className={`px-2 py-0.5 text-xs rounded-full ${selected.is_read ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                    {selected.is_read ? t(lang,'read_label') : t(lang,'unread_label')}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selected.created_at ? new Date(selected.created_at).toLocaleString(locale) : '-'}</span>
                  <span>•</span>
                  <span>{t(lang,'sent_to')}: {selected.target_role === 'parent' ? t(lang,'parents_label') : selected.target_role === 'driver' ? t(lang,'drivers_label') : t(lang,'all_label')}</span>
                  {selected.sender_name && (
                    <>
                      <span>•</span>
                      <span>{t(lang,'sender')}: {selected.sender_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Body content */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {selected.body}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              {selected.is_read ? (
                <button onClick={() => markUnread(selected.id)} className="px-3 py-1.5 text-sm rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t(lang,'mark_unread')}</button>
              ) : (
                <button onClick={() => markAsRead(selected.id)} className="px-3 py-1.5 text-sm rounded bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t(lang,'mark_read')}</button>
              )}
              <button onClick={copyContent} className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 flex items-center gap-1">
                <Copy className="w-4 h-4" /> {t(lang,'copy')}
              </button>
              <button onClick={() => { setDetailOpen(false); removeOne(selected.id) }} className="px-3 py-1.5 text-sm rounded bg-red-600 hover:bg-red-700 text-white">{t(lang,'delete_label')}</button>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">{t(lang,'no_data_label')}</div>
        )}
      </Modal>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        variant={confirmState.variant}
        confirmText={t(lang,'delete_label')}
        cancelText={t(lang,'cancel')}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
        onConfirm={confirmState.onConfirm}
      />
    </div>
  )
}
