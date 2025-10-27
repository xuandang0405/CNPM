import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useUserStore } from '../../store/useUserStore'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'
import { t } from '../../i18n'

export default function ParentLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [emailError, setEmailError] = useState(null)
  const [passwordError, setPasswordError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { lang } = useUserStore()

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null); setEmailError(null); setPasswordError(null)
    const emailVal = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(emailVal)){
      setEmailError('Vui lòng nhập email hợp lệ')
      return
    }
    try{
      const result = await login({ email, password })

      // buộc đổi mật khẩu nếu cần
      if (result.must_change_password) {
        try { localStorage.removeItem('token'); localStorage.removeItem('user') } catch(e) {}
        navigate('/change-password', { 
          state: { 
            message: result.message,
            email: result.email || email,
            isFirstLogin: true 
          } 
        })
        return
      }

      // điều hướng theo vai trò: mong muốn là phụ huynh
      if (result.role === 'parent') navigate('/parent')
      else if (result.role === 'driver') navigate('/driver')
      else if (result.role === 'admin') navigate('/admin')
      else navigate('/')
    }catch(err){
      const code = err && err.error
      if (code === 'invalid_email') setEmailError('Email không hợp lệ')
      else if (code === 'invalid_credentials') setPasswordError('Sai email hoặc mật khẩu')
      else setError('Đăng nhập thất bại')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-full mb-4 shadow-lg">
              <span className="text-4xl">👨‍👩‍👧‍👦</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t(lang,'parent_dashboard')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{t(lang,'track_children_today')}</p>
          </div>

          <div className="flex justify-end mb-6">
            <LanguageSwitcher />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium flex items-center gap-2">
                <span>⚠️</span> {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>📧</span> {t(lang,'email')}
              </label>
              <input 
                type="email"
                className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:ring-4 transition-all outline-none text-gray-900 dark:text-gray-100 ${
                  emailError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder={t(lang,'email_placeholder')} 
              />
              {emailError && (
                <p className="text-red-600 dark:text-red-300 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {emailError}
                </p>
              )}
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>🔒</span> {t(lang,'password')}
              </label>
              <input 
                type="password" 
                className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 rounded-xl focus:ring-4 transition-all outline-none text-gray-900 dark:text-gray-100 ${
                  passwordError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder={t(lang,'password_enter_placeholder')} 
              />
              {passwordError && (
                <p className="text-red-600 dark:text-red-300 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-200">{t(lang,'remember_me')}</span>
              </label>
              <div className="flex items-center gap-3">
                <Link to="/change-password-public" className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium">
                  {t(lang,'change_password')}
                </Link>
                <span className="text-gray-300">|</span>
                <Link to="/forgot-password" className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium">
                  {t(lang,'forgot_password')}
                </Link>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3.5 rounded-xl font-semibold text-lg hover:from-teal-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
            >
              {t(lang,'sign_in')}
            </button>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t(lang,'provisioned_info')}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
