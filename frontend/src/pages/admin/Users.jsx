import React, { useEffect, useState } from 'react'
import { adminListUsers, adminDeleteUser, adminCreateUser } from '../../api/admin'
import { useUserStore } from '../../store/useUserStore'
import { useNavigate } from 'react-router-dom'
import { t } from '../../i18n'

export default function AdminUsers(){
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const { user, lang } = useUserStore()
  const navigate = useNavigate()
  const [openCreate, setOpenCreate] = useState(false)
  const [createData, setCreateData] = useState({ email: '', full_name: '', phone: '', role: 'parent' })
  const [creating, setCreating] = useState(false)

  useEffect(()=>{ load() }, [])
  async function load(){
    setLoading(true); setError(null)
    try{
      const data = await adminListUsers()
      setUsers(data.users || [])
  }catch(e){ setError(e && e.error ? e.error : t(lang,'load_list_failed_try_again')) }
    setLoading(false)
  }

  async function onDelete(id, email){
  const msg = t(lang, 'confirm_delete_user').replace('{email}', email)
    if (!confirm(msg)) return
    try{ 
      await adminDeleteUser(id)
      setUsers(u => u.filter(x=>x.id!==id))
    }catch(e){ 
      alert(t(lang,'delete_failed')+': '+(e.error || e.message || 'Unknown error')) 
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
      admin: t(lang,'admin_role'),
      driver: t(lang,'driver_role'),
      parent: t(lang,'parent_role')
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span>👥</span> {t(lang,'users_page_title')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t(lang,'users_total_label')}: {users.length}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setOpenCreate(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>➕</span> {t(lang,'add_user')}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-300 font-medium">{t(lang,'admin_role')}</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{roleCount.admin}</p>
                </div>
                <span className="text-4xl">👑</span>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">{t(lang,'driver_role')}</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{roleCount.driver}</p>
                </div>
                <span className="text-4xl">🚗</span>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-300 font-medium">{t(lang,'parent_role')}</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{roleCount.parent}</p>
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
                placeholder={t(lang,'search_email_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="all">🌐 {t(lang,'all_roles')}</option>
              <option value="admin">👑 {t(lang,'admin_role')}</option>
              <option value="driver">🚗 {t(lang,'driver_role')}</option>
              <option value="parent">👨‍👩‍👧 {t(lang,'parent_role')}</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-500 dark:text-gray-400">{t(lang,'loading_list')}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">🔍</span>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchTerm || filterRole !== 'all' 
                  ? t(lang,'no_users_found')
                  : t(lang,'no_users_system')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'email')}</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'role')}</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{t(lang,'actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-100">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => onDelete(u.id, u.email)}
                          className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors font-medium flex items-center gap-2 mx-auto"
                        >
                          <span>🗑️</span> {t(lang,'delete_user')}
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
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {t(lang,'total_count')}: {filteredUsers.length} / {users.length}
          </div>
        )}
      </div>
    </div>
    {/* Create User Modal */}
    {openCreate && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={()=>!creating && setOpenCreate(false)} />
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg">
          <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-bold dark:text-gray-100">{t(lang,'add_user')}</h3>
            <button disabled={creating} onClick={()=>setOpenCreate(false)} className="p-2">✖️</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t(lang,'email')}</label>
              <input value={createData.email} onChange={e=>setCreateData(d=>({...d, email:e.target.value}))} type="email" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t(lang,'full_name')}</label>
              <input value={createData.full_name} onChange={e=>setCreateData(d=>({...d, full_name:e.target.value}))} type="text" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t(lang,'phone')}</label>
              <input value={createData.phone} onChange={e=>setCreateData(d=>({...d, phone:e.target.value}))} type="text" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="0123456789" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(lang,'default_password_info')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t(lang,'role')}</label>
              <select value={createData.role} onChange={e=>setCreateData(d=>({...d, role:e.target.value}))} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100">
                <option value="parent">{t(lang,'parent_role')}</option>
                <option value="driver">{t(lang,'driver_role')}</option>
                <option value="admin">{t(lang,'admin_role')}</option>
              </select>
            </div>
          </div>
          <div className="p-6 border-t dark:border-gray-700 flex items-center justify-end gap-3">
            <button disabled={creating} onClick={()=>setOpenCreate(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg">{t(lang,'cancel')}</button>
            <button
              disabled={creating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              onClick={async ()=>{
                // basic validation
                const { email, full_name, phone, role } = createData
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return alert(t(lang,'invalid_email'))
                if (!phone) return alert(t(lang,'please_enter_phone'))
                try{
                  setCreating(true)
                  await adminCreateUser({ email: email.trim(), full_name: full_name || undefined, phone: phone.trim(), role })
                  await load()
                  setOpenCreate(false)
                  setCreateData({ email:'', full_name:'', phone:'', role:'parent' })
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
