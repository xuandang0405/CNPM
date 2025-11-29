import React, { useState } from 'react'
import axiosInstance from '../../api/axios'
import { Send, Bell, AlertCircle, Info, CheckCircle, MessageSquare, Trash2, Eye, Copy, User as UserIcon, Clock, Bookmark } from 'lucide-react'
import useNotifications from '../../hooks/useNotifications'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import Modal from '../../components/common/Modal'

export default function DriverNotifications() {
  const { notifications, unreadCount, loading, markAsRead, deleteNotification, loadNotifications } = useNotifications()
  const { lang } = useUserStore()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('info')
  const [priority, setPriority] = useState('medium')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const openDetail = async (n) => {
    setSelected(n)
    setDetailOpen(true)
    if (!n.is_read) {
      try { await markAsRead(n.id) } catch(e) {}
    }
  }

  const copyContent = async () => {
    if (!selected) return
    try{
      const text = `${selected.title}\n\n${selected.body || ''}`
      await navigator.clipboard.writeText(text)
      alert(t(lang,'copied_notification_content'))
    }catch(e){
      alert(t(lang,'copy_failed'))
    }
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      setError(t(lang,'please_fill_title_body'))
      return
    }
    try {
      setSending(true)
      setError('')
      setSuccess('')
      
      // Driver sends to parents of students on current trip
      const response = await axiosInstance.post('/notifications/send', { 
        title,
        body,
        type,
        priority
      })
      
      setTitle('')
      setBody('')
      const count = response?.data?.count
      if (typeof count === 'number') {
        setSuccess(`✅ ${t(lang,'sent_notification_to')} ${count} ${t(lang,'parent_lower')}`)
      } else {
        setSuccess(`✅ ${t(lang,'notification_sent_to_parents')}`)
      }
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('Failed to send notification:', err)
      const errorMsg = err.response?.data?.error
      if (errorMsg === 'no_recipients_found') {
        setError(t(lang,'no_recipients_found_today'))
      } else {
        setError(t(lang,'failed_to_send_notification'))
      }
    } finally {
      setSending(false)
    }
  }

  // When user wants to refresh inbox
  async function handleRefreshInbox() {
    try {
      await loadNotifications()
    } catch (err) {
      console.error('Failed to refresh notifications:', err)
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

  const quickMessages = [
    { title: t(lang,'qm_depart_on_time_title'), body: t(lang,'qm_depart_on_time_body'), type: 'info' },
    { title: t(lang,'qm_delay_10_title'), body: t(lang,'qm_delay_10_body'), type: 'alert' },
    { title: t(lang,'qm_all_picked_title'), body: t(lang,'qm_all_picked_body'), type: 'success' },
    { title: t(lang,'qm_route_change_title'), body: t(lang,'qm_route_change_body'), type: 'alert' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Inbox */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">{t(lang,'inbox_title')} ({unreadCount})</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefreshInbox} className="text-sm text-white/90 bg-white/10 px-3 py-1 rounded-md">{t(lang,'refresh_button')}</button>
          </div>
        </div>

        <div className="p-4">
          {loading && <div className="text-sm text-gray-500">{t(lang,'loading')}</div>}
          {!loading && notifications.length === 0 && (
            <div className="text-sm text-gray-500">{t(lang,'no_notifications')}</div>
          )}

          <div className="space-y-3">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-3 border rounded-lg flex items-start justify-between ${n.is_read ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'} cursor-pointer hover:shadow-sm transition`}
                onClick={() => openDetail(n)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{n.title}</h4>
                    {!n.is_read && <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded">{t(lang,'new_label')}</span>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{n.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(n.created_at || n.createdAt || n.created).toLocaleString(locale)}</span>
                    {n.sender_name || n.sender_role ? (
                      <span className="inline-flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" />{n.sender_name || n.sender_role}</span>
                    ) : null}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-2" onClick={(e)=>e.stopPropagation()}>
                  <button onClick={() => openDetail(n)} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Eye className="w-4 h-4"/> {t(lang,'view_details')}
                  </button>
                  {!n.is_read && (
                    <button onClick={() => markAsRead(n.id)} className="text-sm text-green-600 dark:text-green-400">{t(lang,'mark_read')}</button>
                  )}
                  <button onClick={() => {
                    if (!confirm(t(lang,'confirm_delete_notification'))) return;
                    deleteNotification(n.id)
                  }} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><Trash2 className="w-4 h-4"/> {t(lang,'delete_label')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={t(lang,'notification_detail_title')} size="md">
        {!selected ? null : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selected.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <UserIcon className="w-4 h-4"/>
                  {t(lang,'from_label')}: {selected.sender_name || selected.sender_role || 'system'}
                </span>
                {selected.type && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <Bookmark className="w-3.5 h-3.5"/> {t(lang,'notification_type')}: {selected.type}
                  </span>
                )}
                {selected.priority && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    <AlertCircle className="w-3.5 h-3.5"/> {t(lang,'priority_level')}: {t(lang, selected.priority) || selected.priority}
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5"/>
                {new Date(selected.created_at || selected.createdAt || selected.created).toLocaleString(locale)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
              {selected.body || ''}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={copyContent} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Copy className="w-4 h-4"/> {t(lang,'copy')}
              </button>
              <button onClick={() => setDetailOpen(false)} className="px-3 py-2 rounded-lg bg-blue-600 text-white">
                {t(lang,'close')}
              </button>
            </div>
          </div>
        )}
      </Modal>
      {/* Quick Messages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">{t(lang,'quick_messages_title')}</h2>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t(lang,'quick_messages_hint')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickMessages.map((msg, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTitle(msg.title)
                  setBody(msg.body)
                  setType(msg.type)
                }}
                className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">{msg.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{msg.body}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Send Custom Notification */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Send className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">{t(lang,'send_notifications')}</h2>
          </div>
        </div>
        
        <div className="p-6">
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

          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-600 dark:text-blue-400">
              <p className="font-medium mb-1">{t(lang,'send_to_parents_today_title')}</p>
              <p className="text-blue-600/80 dark:text-blue-400/80">
                {t(lang,'send_to_parents_today_desc')}
              </p>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }} className="space-y-4">
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
              disabled={sending || !title.trim() || !body.trim()}
            >
              <Send className="w-5 h-5" />
              {sending ? t(lang,'sending') : t(lang,'send_notification')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
