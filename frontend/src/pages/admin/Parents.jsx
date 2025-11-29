import React, { useEffect, useState } from 'react'
import { adminListUsers, adminDeleteUser, adminCreateUser } from '../../api/admin'
import { useUserStore } from '../../store/useUserStore'
import { t } from '../../i18n'

export default function ParentsPage(){
  const { user, lang } = useUserStore()
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [createData, setCreateData] = useState({ email: '', full_name: '', phone: '' })
  const [creating, setCreating] = useState(false)

  useEffect(()=>{ load() }, [])
  async function load(){
    setLoading(true); setError(null)
    try{
      const data = await adminListUsers()
      const list = (data.users || []).filter(u => u.role === 'parent')
      setParents(list)
    }catch(e){ setError(e && e.error ? e.error : t(lang,'load_list_failed_try_again')) }
    setLoading(false)
  }

  async function onDelete(id, email){
    const msg = t(lang, 'confirm_delete_user').replace('{email}', email)
    if (!confirm(msg)) return
    try{ 
      await adminDeleteUser(id)
      setParents(u => u.filter(x=>x.id!==id))
    }catch(e){ 
      alert(t(lang,'delete_failed')+': '+(e.error || e.message || 'Unknown error')) 
    }
  }

  const filtered = parents.filter(u => (
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  ))

  if (!user || user.role !== 'admin'){
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
          <div className="text-center">
            <span className="text-6xl">🔒</span>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">{t(lang,'access_denied_title')}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{t(lang,'access_denied_desc')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <span>👨‍👩‍👧</span> {t(lang,'manage_parents')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t(lang,'total_parents')}: {parents.length}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setOpenCreate(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <span>➕</span> {t(lang,'add_parent')}
                </button>
                <button 
                  onClick={load}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <span>🔄</span> {loading ? t(lang,'loading') : t(lang,'refresh')}
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t(lang,'search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                <span className="text-xl">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
                <p className="text-gray-500 dark:text-gray-400">{t(lang,'loading_list')}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-6xl mb-4 block">🔍</span>
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t(lang,'no_users_found')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'full_name')}</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'email')}</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'phone')}</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filtered.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-gray-800 dark:text-gray-100">{u.full_name || '-'}</td>
                        <td className="px-6 py-4 text-gray-800 dark:text-gray-100">{u.email}</td>
                        <td className="px-6 py-4 text-gray-800 dark:text-gray-100">{u.phone || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => onDelete(u.id, u.email)}
                            className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors font-medium"
                          >
                            🗑️ {t(lang,'delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Parent Modal */}
      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!creating && setOpenCreate(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold dark:text-gray-100">{t(lang,'add_parent')}</h3>
              <button disabled={creating} onClick={()=>setOpenCreate(false)} className="p-2">✖️</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t(lang,'full_name')}</label>
                <input value={createData.full_name} onChange={e=>setCreateData(d=>({...d, full_name:e.target.value}))} type="text" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t(lang,'email')}</label>
                <input value={createData.email} onChange={e=>setCreateData(d=>({...d, email:e.target.value}))} type="email" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="parent@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t(lang,'phone')}</label>
                <input value={createData.phone} onChange={e=>setCreateData(d=>({...d, phone:e.target.value}))} type="text" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="0123456789" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(lang,'default_password_info')}</p>
              </div>
            </div>
            <div className="p-6 border-t dark:border-gray-700 flex items-center justify-end gap-3">
              <button disabled={creating} onClick={()=>setOpenCreate(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg">{t(lang,'cancel')}</button>
              <button
                disabled={creating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                onClick={async ()=>{
                  const { email, full_name, phone } = createData
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return alert(t(lang,'invalid_email'))
                  if (!phone) return alert(t(lang,'please_enter_phone'))
                  try{
                    setCreating(true)
                    await adminCreateUser({ email: email.trim(), full_name: full_name || undefined, phone: phone.trim(), role: 'parent' })
                    await load()
                    setOpenCreate(false)
                    setCreateData({ email:'', full_name:'', phone:'' })
                  }catch(e){
                    alert(t(lang,'error') + ': ' + (e.error || e.message || 'Unknown error'))
                  }finally{ setCreating(false) }
                }}
              >{creating ? t(lang,'creating') : t(lang,'create_account')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
