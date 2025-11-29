import React, { useEffect, useState } from 'react'
import axiosInstance from '../../api/axios'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'
import { Bell, Clock, Eye, Copy, User } from 'lucide-react'
import Modal from '../../components/common/Modal'

export default function NotificationsHistory() {
  const { lang } = useUserStore()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => { loadHistory() }, [])

  async function loadHistory() {
    try {
      setLoading(true)
      const { data } = await axiosInstance.get('/admin/notifications')
      const list = Array.isArray(data) ? data : (data?.notifications || [])
      setHistory(list)
    } catch (err) {
      console.error('Failed to load admin notifications history:', err)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const openDetail = (n) => {
    setSelected(n)
    setDetailOpen(true)
  }

  const copyContent = async () => {
    try {
      if (!selected) return
      const text = `${selected.title}\n\n${selected.body || ''}\n\n(${selected.created_at ? new Date(selected.created_at).toLocaleString(locale) : ''})`
      await navigator.clipboard.writeText(text)
      alert(t(lang,'copied_notification_content'))
    } catch (e) {
      console.error('Failed to copy notification', e)
      alert(t(lang,'copy_failed'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">{t(lang,'notifications_history')} ({history.length})</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadHistory} className="text-sm text-white/90 bg-white/10 px-3 py-1 rounded-md">{t(lang,'refresh_button')}</button>
          </div>
        </div>
        <div className="p-4">
          {loading && <div className="text-sm text-gray-500">{t(lang,'loading')}</div>}
          {!loading && history.length === 0 && (
            <div className="text-sm text-gray-500">{t(lang,'no_notifications')}</div>
          )}
          <div className="space-y-3">
            {history.map((n) => (
              <div key={n.id} className="p-3 border rounded-lg flex items-start justify-between bg-white dark:bg-gray-800">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{n.title}</h4>
                    {n.priority && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{t(lang, n.priority) || n.priority}</span>}
                    {n.type && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{n.type}</span>}
                  </div>
                  {n.body && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{n.body}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{n.created_at ? new Date(n.created_at).toLocaleString(locale) : '-'}</span>
                    {n.email && <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" />{n.email}</span>}
                    {n.target_role && <span className="inline-flex items-center gap-1">🎯 {n.target_role}</span>}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-2">
                  <button onClick={() => openDetail(n)} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Eye className="w-4 h-4"/> {t(lang,'view_details')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={detailOpen} title={selected?.title || t(lang,'notification_detail_title')} onClose={() => setDetailOpen(false)} size="md">
        {selected ? (
          <div className="space-y-4">
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{selected.created_at ? new Date(selected.created_at).toLocaleString(locale) : '-'}</span>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {selected.body}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={copyContent} className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 flex items-center gap-1">
                <Copy className="w-4 h-4" /> {t(lang,'copy')}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">{t(lang,'no_data_label')}</div>
        )}
      </Modal>
    </div>
  )
}
