import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePasswordPublic } from '../api/users'
import { useToast } from '../components/common/ToastProvider'
import { useUserStore } from '../store/useUserStore'
import { t } from '../i18n'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

export default function PublicChangePassword(){
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { lang } = useUserStore()

  const validate = () => {
    const e = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = t(lang,'invalid_email')
  if (!currentPassword) e.current = t(lang,'enter_current_password')
  if (!newPassword) e.new = t(lang,'enter_new_password')
  if (newPassword && newPassword.length < 6) e.new = t(lang,'password_min6')
  if (newPassword !== confirmPassword) e.confirm = t(lang,'passwords_do_not_match')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try{
      setSubmitting(true)
      await changePasswordPublic({ email: email.trim(), current_password: currentPassword, new_password: newPassword })
      addToast({ type: 'success', title: t(lang,'success'), message: t(lang,'password_change_success') })
      try { sessionStorage.clear(); localStorage.clear() } catch(err) {}
      setTimeout(()=> navigate('/login'), 800)
    }catch(err){
      const code = err && err.error
      if (code === 'invalid_credentials') {
        setErrors({ current: t(lang,'current_password_incorrect') })
        addToast({ type: 'error', title: t(lang,'error'), message: t(lang,'current_password_incorrect') })
      } else if (code === 'user_not_found') {
        setErrors({ email: t(lang,'user_not_found') })
        addToast({ type: 'error', title: t(lang,'error'), message: t(lang,'user_not_found') })
      } else {
        addToast({ type: 'error', title: t(lang,'error'), message: t(lang,'login_failed') })
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700">
          <div className="flex justify-end mb-4"><LanguageSwitcher /></div>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t(lang,'public_change_password_title')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{t(lang,'public_change_password_desc')}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t(lang,'email')}</label>
              <input 
                type="email" 
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.email ? 'border-red-500' : ''}`}
                placeholder={t(lang,'email_placeholder')}
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t(lang,'current_password_label')}</label>
              <input 
                type="password" 
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.current ? 'border-red-500' : ''}`}
                placeholder={t(lang,'enter_current_password')}
                value={currentPassword}
                onChange={(e)=>setCurrentPassword(e.target.value)}
              />
              {errors.current && <p className="text-sm text-red-600 dark:text-red-300 mt-1">{errors.current}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t(lang,'new_password_label')}</label>
              <input 
                type="password" 
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.new ? 'border-red-500' : ''}`}
                placeholder={t(lang,'password_min6')}
                value={newPassword}
                onChange={(e)=>setNewPassword(e.target.value)}
              />
              {errors.new && <p className="text-sm text-red-600 dark:text-red-300 mt-1">{errors.new}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t(lang,'confirm_new_password_label')}</label>
              <input 
                type="password" 
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 ${errors.confirm ? 'border-red-500' : ''}`}
                placeholder={t(lang,'confirm_password_placeholder')}
                value={confirmPassword}
                onChange={(e)=>setConfirmPassword(e.target.value)}
              />
              {errors.confirm && <p className="text-sm text-red-600 dark:text-red-300 mt-1">{errors.confirm}</p>}
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:shadow-lg transition-all"
            >
              {submitting ? t(lang,'processing') : t(lang,'change_password')}
            </button>

            <button
              type="button"
              onClick={()=> navigate('/login')}
              className="w-full mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t(lang,'back_to_login')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
