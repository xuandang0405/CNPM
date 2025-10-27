import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Button from '../components/common/Button'
import { createUser } from '../api/users'
import { t } from '../i18n'
import { useUserStore } from '../store/useUserStore'
import AlertBanner from '../components/common/AlertBanner'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

export default function Register(){
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const role = 'parent' // Auto set to parent
  const [emailError, setEmailError] = useState(null)
  const [passwordError, setPasswordError] = useState(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState(null)
  const navigate = useNavigate()
  const { lang } = useUserStore()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleSubmit(e){
    e.preventDefault()
    setError(null); setEmailError(null); setPasswordError(null); setConfirmPasswordError(null)
    
    // Validation
    if (!name.trim()) {
      setError(t(lang,'enter_full_name'))
      return
    }
    if (!phone.trim()) {
      setError(t(lang,'please_enter_phone'))
      return
    }
    if (!email.trim()) {
      setEmailError(t(lang,'please_enter_email'))
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError(t(lang,'invalid_email'))
      return
    }
    if (!password) {
      setPasswordError(t(lang,'enter_password'))
      return
    }
    if (password.length < 6) {
      setPasswordError(t(lang,'password_min6'))
      return
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError(t(lang,'confirm_password_mismatch'))
      return
    }
    
    try{
      console.log('Register attempt', { email, role })
      await createUser({ name, phone, email, password, role })
      console.log('Register success', { email })
      setSuccess(t(lang,'register_success_redirect'))
      setTimeout(()=>navigate('/login'), 1500)
    }catch(err){
      console.error('Register error', err)
      const code = err && err.error
      if (code === 'invalid_email') setEmailError(t(lang,'invalid_email'))
      else if (code === 'password_too_short') setPasswordError(t(lang,'password_min6'))
      else if (code === 'email already in use') setEmailError(t(lang,'invalid_email'))
      else setError(t(lang,'register_failed'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Card với hiệu ứng glass */}
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700">
          {/* Header với animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4 shadow-lg animate-bounce">
              <span className="text-4xl">🎓</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {t(lang,'register_title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{t(lang,'register_subtitle')}</p>
          </div>

          <div className="flex justify-end mb-6"><LanguageSwitcher /></div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-pulse">
              <p className="text-green-800 text-sm font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>👤</span> {t(lang,'full_name')}
              </label>
              <input 
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" 
                placeholder={t(lang,'name_placeholder')} 
                value={name} 
                onChange={e=>setName(e.target.value)} 
              />
            </div>

            {/* Phone Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>📱</span> {t(lang,'phone')}
              </label>
              <input 
                type="tel"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" 
                placeholder={t(lang,'phone_placeholder')} 
                value={phone} 
                onChange={e=>setPhone(e.target.value)} 
              />
            </div>

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
                    : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-100'
                }`}
                placeholder={t(lang,'email_placeholder')} 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
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
                    : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-100'
                }`}
                placeholder={t(lang,'password_min6')} 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
              />
              {passwordError && (
                <p className="text-red-600 dark:text-red-300 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>🔐</span> {t(lang,'confirm_password')}
              </label>
              <input 
                type="password"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
                  confirmPasswordError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-100'
                }`}
                placeholder={t(lang,'confirm_password_placeholder')} 
                value={confirmPassword} 
                onChange={e=>setConfirmPassword(e.target.value)} 
              />
              {confirmPasswordError && (
                <p className="text-red-600 dark:text-red-300 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Role Info (Auto Parent) */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 border-2 border-purple-200 dark:border-gray-700 rounded-xl p-4">
              <p className="text-sm text-purple-800 dark:text-purple-200 font-medium flex items-center gap-2">
                <span>👨‍👩‍👧</span> {t(lang,'role_info_parent')}
              </p>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t(lang,'register_now')} 🚀
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t(lang,'or')}</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300">
                {t(lang,'already_have_account')}{' '}
                <Link 
                  to="/login" 
                  className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
                >
                  {t(lang,'login_now')}
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
          {t(lang,'agree_terms')}{' '}
          <a href="#" className="text-purple-600 hover:underline">{t(lang,'terms_of_service')}</a>
          {' '} {t(lang,'and') ? t(lang,'and') : 'và'} {' '}
          <a href="#" className="text-purple-600 hover:underline">{t(lang,'privacy_policy')}</a>
        </p>
      </div>
    </div>
  )
}
