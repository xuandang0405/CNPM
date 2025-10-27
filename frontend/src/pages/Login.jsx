import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUserStore } from '../store/useUserStore'
import { t } from '../i18n'
import Button from '../components/common/Button'
import LanguageSwitcher from '../components/common/LanguageSwitcher'
import AlertBanner from '../components/common/AlertBanner'
import { createTestUser, createAdminUser, loginUser } from '../api/users'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [emailError, setEmailError] = useState(null)
  const [passwordError, setPasswordError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [autoLoading, setAutoLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null); setEmailError(null); setPasswordError(null)
    // basic email validation on client
    const emailVal = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(emailVal)){
      setEmailError(t(lang,'invalid_email'))
      return
    }
    try{
      console.log('Login attempt', { email, passwordLength: String(password).length })
      const result = await login({ email, password })
      
      // Check if user must change password
      if (result.must_change_password) {
        // Token is already stored in sessionStorage by useAuth; ensure any lingering tokens are cleared
        try { localStorage.removeItem('token'); localStorage.removeItem('user') } catch(e) {}
        console.log('Must change password first')
        navigate('/change-password', { 
          state: { 
            message: result.message,
            email: result.email || email,
            isFirstLogin: true 
          } 
        })
        return
      }
      
      console.log('Login success', result)
      // navigate based on role if provided; default to parent
      if (result.role === 'admin') navigate('/admin')
      else if (result.role === 'driver') navigate('/driver')
      else navigate('/parent')
    }catch(err){
      console.error('Login error', err)
      const code = err && err.error
      if (code === 'invalid_email') setEmailError(t(lang,'invalid_email'))
      else if (code === 'invalid_credentials') setPasswordError(t(lang,'invalid_credentials'))
      else setError(t(lang,'login_failed'))
    }
  }

  const { lang } = useUserStore()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Card với hiệu ứng glass */}
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700">
          {/* Logo/Title Section với animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg animate-bounce">
              <span className="text-4xl">🚌</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {t(lang,'login_welcome_title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{t(lang,'login_welcome_subtitle')}</p>
          </div>

          {/* Language Switcher */}
          <div className="flex justify-end mb-6">
            <LanguageSwitcher />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-lg animate-shake">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium flex items-center gap-2">
                <span>⚠️</span> {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>📧</span> {t(lang,'email')}
              </label>
              <input 
                type="email"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
                  emailError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-100'
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

            {/* Password Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>🔒</span> {t(lang,'password')}
              </label>
              <input 
                type="password" 
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
                  passwordError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-100'
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

            {/* Remember & Forgot/Change Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-200">{t(lang,'remember_me')}</span>
              </label>
              <div className="flex items-center gap-3">
                <Link to="/change-password-public" className="text-purple-600 hover:text-purple-700 hover:underline font-medium">
                  {t(lang,'change_password')}
                </Link>
                <span className="text-gray-300">|</span>
                <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                  {t(lang,'forgot_password')}
                </Link>
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t(lang,'sign_in')} 🚀
            </button>

            {/* Info: Accounts are provisioned by admin */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t(lang,'provisioned_info')}
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/60 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 shadow">
            <span className="text-2xl block mb-1">🔒</span>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{t(lang,'feature_security')}</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 shadow">
            <span className="text-2xl block mb-1">⚡</span>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{t(lang,'feature_fast')}</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 shadow">
            <span className="text-2xl block mb-1">📱</span>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{t(lang,'feature_easy')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
