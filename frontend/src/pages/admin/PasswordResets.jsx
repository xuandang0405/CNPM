import React, { useEffect, useState } from 'react'
import { adminListPasswordResetRequests, adminApprovePasswordReset, adminRejectPasswordReset } from '../../api/admin'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'

export default function PasswordResets(){
  const { lang } = useUserStore()
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  async function load(){
    setLoading(true); setError(null)
    try{
      const res = await adminListPasswordResetRequests(status)
      setRequests(res.requests || [])
    }catch(e){
      if (e?.status === 401 || e?.status === 403){
        setError(t(lang,'session_expired_or_forbidden_admin'))
      } else {
        setError(t(lang,'load_list_failed_try_again'))
      }
    }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ load() }, [status])
  
  // Auto refresh when enabled
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      load()
    }, 20000) // every 20s
    return () => clearInterval(id)
  }, [autoRefresh, status])

  async function approve(id){
    try{ await adminApprovePasswordReset(id); await load() }catch(e){ alert(t(lang,'approve_failed')) }
  }
  async function reject(id){
    const notes = prompt(t(lang,'reject_reason_optional')) || undefined
    try{ await adminRejectPasswordReset({ request_id: id, notes }); await load() }catch(e){ alert(t(lang,'reject_failed')) }
  }

  return (
    <div className="text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t(lang,'password_resets_page_title')}</h2>
        <div className="flex items-center gap-2">
          <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600">
            <option value="pending">{t(lang,'pending')}</option>
            <option value="approved">{t(lang,'approved')}</option>
            <option value="rejected">{t(lang,'rejected')}</option>
            <option value="all">{t(lang,'all')}</option>
          </select>
          <button onClick={load} className="px-3 py-1 bg-blue-600 text-white rounded">{t(lang,'refresh')}</button>
          <label className="ml-2 inline-flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} />
            {t(lang,'auto_refresh_20s')}
          </label>
        </div>
      </div>

      {error && <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">{error}</div>}

      <div className="bg-white dark:bg-gray-800 rounded shadow border border-gray-100 dark:border-gray-700 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 text-left">
              <th className="px-4 py-2 text-gray-700 dark:text-gray-200">{t(lang,'email')}</th>
              <th className="px-4 py-2 text-gray-700 dark:text-gray-200">{t(lang,'name')}</th>
              <th className="px-4 py-2 text-gray-700 dark:text-gray-200">{t(lang,'role')}</th>
              <th className="px-4 py-2 text-gray-700 dark:text-gray-200">{t(lang,'phone')}</th>
              <th className="px-4 py-2 text-gray-700 dark:text-gray-200">{t(lang,'status')}</th>
              <th className="px-4 py-2 text-gray-700 dark:text-gray-200">{t(lang,'time')}</th>
              <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">{t(lang,'actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-4 text-gray-600 dark:text-gray-300" colSpan={7}>{t(lang,'loading')}</td></tr>
            ) : requests.length === 0 ? (
              <tr><td className="px-4 py-4 text-gray-600 dark:text-gray-300" colSpan={7}>{t(lang,'no_requests')}</td></tr>
            ) : (
              requests.map(r => (
                <tr key={r.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{r.email}</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{r.full_name || '-'}</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{r.role === 'admin' ? t(lang,'admin_role') : r.role === 'driver' ? t(lang,'driver_role') : r.role === 'parent' ? t(lang,'parent_role') : r.role}</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{r.phone}</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{r.status === 'pending' ? t(lang,'pending') : r.status === 'approved' ? t(lang,'approved') : r.status === 'rejected' ? t(lang,'rejected') : r.status}</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{r.requested_at ? new Date(r.requested_at).toLocaleString() : '-'}</td>
                  <td className="px-4 py-2 text-right">
                    {status === 'pending' ? (
                      <div className="flex gap-2 justify-end">
                        <button onClick={()=>approve(r.id)} className="px-3 py-1 bg-green-600 text-white rounded">{t(lang,'approve')}</button>
                        <button onClick={()=>reject(r.id)} className="px-3 py-1 bg-gray-300 dark:bg-gray-600 dark:text-gray-100 rounded">{t(lang,'reject')}</button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
