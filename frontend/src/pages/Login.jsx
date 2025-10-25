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
      setEmailError('Vui lòng nhập email hợp lệ')
      return
    }
    try{
      console.log('Login attempt', { email, passwordLength: String(password).length })
      const user = await login({ email, password })
      console.log('Login success', user)
      // navigate based on role if provided; default to parent
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'driver') navigate('/driver')
      else navigate('/parent')
    }catch(err){
      console.error('Login error', err)
      const code = err && err.error
      if (code === 'invalid_email') setEmailError('Email không hợp lệ')
      else if (code === 'invalid_credentials') setPasswordError('Sai email hoặc mật khẩu')
      else setError('Đăng nhập thất bại')
    }
  }

  const { lang } = useUserStore()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Card với hiệu ứng glass */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Logo/Title Section với animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg animate-bounce">
              <span className="text-4xl">🚌</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Chào mừng trở lại!
            </h2>
            <p className="text-gray-600">Đăng nhập để tiếp tục</p>
          </div>

          {/* Language Switcher */}
          <div className="flex justify-end mb-6">
            <LanguageSwitcher />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
              <p className="text-red-800 text-sm font-medium flex items-center gap-2">
                <span>⚠️</span> {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>📧</span> Email
              </label>
              <input 
                type="email"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none ${
                  emailError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder="example@email.com" 
              />
              {emailError && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {emailError}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>🔒</span> Mật khẩu
              </label>
              <input 
                type="password" 
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none ${
                  passwordError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="Nhập mật khẩu" 
              />
              {passwordError && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {passwordError}
                </p>
              )}
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-600 group-hover:text-gray-800">Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                Quên mật khẩu?
              </a>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Đăng nhập 🚀
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Chưa có tài khoản?{' '}
                <Link className="text-blue-600 hover:text-blue-700 font-semibold hover:underline" to="/register">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow">
            <span className="text-2xl block mb-1">🔒</span>
            <p className="text-xs text-gray-600 font-medium">Bảo mật</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow">
            <span className="text-2xl block mb-1">⚡</span>
            <p className="text-xs text-gray-600 font-medium">Nhanh chóng</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow">
            <span className="text-2xl block mb-1">📱</span>
            <p className="text-xs text-gray-600 font-medium">Dễ dàng</p>
          </div>
        </div>
      </div>
    </div>
  )
}
