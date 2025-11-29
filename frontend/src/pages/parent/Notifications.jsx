import React, { useMemo, useState } from 'react'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import { Bell, BellOff, AlertCircle, Info, CheckCircle, Trash2, User, Shield } from 'lucide-react'
import Modal from '../../components/common/Modal'
import useNotifications from '../../hooks/useNotifications'

export default function ParentNotifications() {
  const { lang } = useUserStore()
  const { notifications, unreadCount, loading, markAsRead, deleteNotification } = useNotifications()
  const [filter, setFilter] = useState('all') // all, unread, read
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const openDetail = async (notification) => {
    setSelected(notification)
    setOpen(true)
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id)
        setSelected(prev => prev ? { ...prev, is_read: true } : prev)
      } catch (e) { /* ignore */ }
    }
  }

  const getLocalizedTitle = (n) => {
    if (n?.type === 'emergency' && typeof n?.title === 'string') {
      const m = n.title.match(/Emergency:\s*(\w+)\s*\((low|medium|high|critical)\)/i)
      if (m) {
        const et = m[1].toLowerCase()
        const sev = m[2].toLowerCase()
        const etKey = `emergency_type_${et}`
        return `${t(lang, etKey) || et} • ${t(lang, sev) || sev}`
      }
    }
    return n?.title || ''
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

  const filteredNotifications = useMemo(() => notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'read') return n.is_read
    return true
  }), [notifications, filter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20 dark:border-gray-700/60 text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{t(lang,'loading_notifications')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 space-y-6 pb-8">
      {/* Header with Glass Morphism */}
      <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 border border-white/20 dark:border-gray-700/60">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 shadow-lg animate-float">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t(lang,'notifications_title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
                {unreadCount > 0 ? (
                  <>
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="font-semibold text-red-600">{unreadCount} {t(lang,'unread_label')}</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>{t(lang,'all_notifications_read')}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs with Gradient */}
  <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700 p-2 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
            filter === 'all' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t(lang,'all_label')} ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
            filter === 'unread' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t(lang,'unread_label')} ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
            filter === 'read' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t(lang,'read_label')} ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/60 p-12 text-center">
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <BellOff className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {t(lang,'no_notifications')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {filter === 'unread' ? t(lang,'all_notifications_read') : t(lang,'no_notifications')}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white/90 dark:bg-gray-800 backdrop-blur-sm rounded-2xl shadow-xl border-2 p-6 transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
                notification.is_read 
                  ? 'border-gray-200 dark:border-gray-700' 
                  : notification.priority === 'high'
                  ? 'border-red-300 dark:border-red-700 bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-900/30 dark:to-orange-900/20'
                  : notification.type === 'success'
                  ? 'border-green-300 dark:border-green-700 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20'
                  : notification.type === 'warning'
                  ? 'border-yellow-300 dark:border-yellow-700 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 dark:from-yellow-900/20 dark:to-orange-900/20'
                  : 'border-blue-300 dark:border-blue-700 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20'
              }`}
              onClick={() => openDetail(notification)}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-3 rounded-xl ${
                  notification.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                  notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                  notification.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {getIcon(notification.type, notification.priority)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg flex items-center gap-2">
                        {getLocalizedTitle(notification)}
                        {!notification.is_read && (
                          <span className="inline-block px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
                            {t(lang,'new_label')}
                          </span>
                        )}
                      </h3>
                      {notification.sender_name && (
                        <div className="flex items-center gap-2 mt-2 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg px-3 py-1.5 inline-flex">
                          {notification.sender_role === 'admin' ? (
                            <Shield className="w-4 h-4 text-purple-600" />
                          ) : (
                            <User className="w-4 h-4 text-blue-600" />
                          )}
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                            {t(lang,'from_label')} {notification.sender_role === 'admin' ? t(lang,'admin_role') : t(lang,'driver_role')}: <span className="font-bold">{notification.sender_name}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line leading-relaxed">
                    {notification.body}
                  </p>
                  
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg font-medium">
                        <span>🕒</span>
                        {new Date(notification.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {notification.priority === 'high' && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-bold flex items-center gap-1 shadow-md">
                          <span>⚠️</span> {t(lang,'high_priority')}
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(t(lang,'confirm_delete_notification'))) deleteNotification(notification.id)
                      }}
                      className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all hover:scale-110 border border-red-200 dark:border-red-800/50"
                      title={t(lang,'delete_label')}
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

      {/* Detail Modal */}
  <Modal open={open} onClose={() => setOpen(false)} title={selected ? getLocalizedTitle(selected) : ''} size="md">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                selected.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                selected.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                selected.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {getIcon(selected.type, selected.priority)}
              </div>
              <div className="flex-1 min-w-0">
                {selected.sender_name && (
                  <div className="flex items-center gap-2 mb-2 bg-gray-50 dark:bg-gray-700/60 rounded-lg px-3 py-1.5 inline-flex">
                    {selected.sender_role === 'admin' ? (
                      <Shield className="w-4 h-4 text-purple-600" />
                    ) : (
                      <User className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      {t(lang,'from_label')} {selected.sender_role === 'admin' ? t(lang,'admin_role') : t(lang,'driver_role')}: <span className="font-bold">{selected.sender_name}</span>
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <span>🕒</span>
                    {new Date(selected.created_at).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                  </span>
                  {selected.priority === 'high' && (
                    <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded font-semibold">⚠️ {t(lang,'high_priority')}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">{selected.body}</p>
            </div>

            <div className="flex justify-end gap-3">
              {!selected.is_read && (
                <button
                  onClick={async () => { await markAsRead(selected.id); setSelected({ ...selected, is_read: true }) }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  {t(lang,'mark_as_read') || 'Mark as read'}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t(lang,'close')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
