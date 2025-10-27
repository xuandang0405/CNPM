import React, { useState } from 'react'
import { forgotPassword } from '../api/users'
import { Link } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { t } from '../i18n'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

export default function ForgotPassword(){
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { lang } = useUserStore()

  async function handleSubmit(e){
    e.preventDefault()
    setStatus(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())){
      setStatus({ type: 'error', message: t(lang,'invalid_email') })
      return
    }
    try{
      setLoading(true)
      await forgotPassword({ email: email.trim() })
      setStatus({ type: 'success', message: t(lang,'forgot_request_sent') })
      setEmail('')
    }catch(err){
      console.error('forgot password error', err)
      setStatus({ type: 'error', message: t(lang,'try_again_later') })
    }finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700">
          <div className="flex justify-end mb-4"><LanguageSwitcher /></div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t(lang,'forgot_password_title')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {t(lang,'forgot_password_desc')}
          </p>

          {status && (
            <div className={`mb-4 p-3 rounded ${status.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200'}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t(lang,'email')}</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100" placeholder={t(lang,'email_placeholder')} />
            </div>

            <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded">{loading ? t(lang,'processing') : t(lang,'send_request')}</button>

            <div className="text-center mt-3">
              <Link to="/login" className="text-blue-600 hover:underline">{t(lang,'back_to_login')}</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
