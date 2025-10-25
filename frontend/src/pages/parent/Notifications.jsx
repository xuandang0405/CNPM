import React, { useEffect, useState } from 'react'
import axiosInstance from '../../api/axios'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import { Bell, BellOff, AlertCircle, Info, CheckCircle, XCircle, Trash2, User, Shield } from 'lucide-react'

export default function ParentNotifications() {
  const { lang, user } = useUserStore()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/parents/notifications')
      setNotifications(response.data.notifications || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/parents/notifications/${notificationId}/read`)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return
    try {
      await axiosInstance.delete(`/parents/notifications/${notificationId}`)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getIcon = (type, priority) => {
    if (priority === 'high') return <AlertCircle className="w-5 h-5 text-red-600" />
    switch (type) {
      case 'alert':
      case 'emergency':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getBgColor = (type, priority, isRead) => {
    if (isRead) return 'bg-gray-50'
    if (priority === 'high') return 'bg-red-50 border-red-200'
    switch (type) {
      case 'alert':
      case 'emergency':
        return 'bg-red-50 border-red-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'read') return n.is_read
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20 text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải thông báo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 space-y-6 pb-8">
      {/* Header with Glass Morphism */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 shadow-lg animate-float">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Thông báo
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                {unreadCount > 0 ? (
                  <>
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="font-semibold text-red-600">{unreadCount} thông báo chưa đọc</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>Tất cả thông báo đã đọc</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs with Gradient */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-2 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
            filter === 'all' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
            filter === 'unread' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
            filter === 'read' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Đã đọc ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-12 text-center">
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <BellOff className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Không có thông báo
            </h3>
            <p className="text-gray-600">
              {filter === 'unread' ? 'Tất cả thông báo đã được đọc' : 'Chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 p-6 transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
                notification.is_read 
                  ? 'border-gray-200' 
                  : notification.priority === 'high'
                  ? 'border-red-300 bg-gradient-to-r from-red-50/80 to-orange-50/80'
                  : notification.type === 'success'
                  ? 'border-green-300 bg-gradient-to-r from-green-50/80 to-emerald-50/80'
                  : notification.type === 'warning'
                  ? 'border-yellow-300 bg-gradient-to-r from-yellow-50/80 to-orange-50/80'
                  : 'border-blue-300 bg-gradient-to-r from-blue-50/80 to-indigo-50/80'
              }`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-3 rounded-xl ${
                  notification.priority === 'high' ? 'bg-red-100' :
                  notification.type === 'success' ? 'bg-green-100' :
                  notification.type === 'warning' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  {getIcon(notification.type, notification.priority)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        {notification.title}
                        {!notification.is_read && (
                          <span className="inline-block px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
                            Mới
                          </span>
                        )}
                      </h3>
                      {notification.sender_name && (
                        <div className="flex items-center gap-2 mt-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-1.5 inline-flex">
                          {notification.sender_role === 'admin' ? (
                            <Shield className="w-4 h-4 text-purple-600" />
                          ) : (
                            <User className="w-4 h-4 text-blue-600" />
                          )}
                          <span className="text-xs text-gray-700 font-medium">
                            Từ {notification.sender_role === 'admin' ? 'Quản trị viên' : 'Tài xế'}: <span className="font-bold">{notification.sender_name}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 whitespace-pre-line leading-relaxed">
                    {notification.body}
                  </p>
                  
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                        <span>🕒</span>
                        {new Date(notification.created_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {notification.priority === 'high' && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-bold flex items-center gap-1 shadow-md">
                          <span>⚠️</span> Ưu tiên cao
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 border border-red-200"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
