import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Button from '../components/common/Button'
import { createUser } from '../api/users'
import { t } from '../i18n'
import { useUserStore } from '../store/useUserStore'
import AlertBanner from '../components/common/AlertBanner'

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
      setError('Vui lòng nhập họ và tên')
      return
    }
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại')
      return
    }
    if (!email.trim()) {
      setEmailError('Vui lòng nhập email')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError('Email không hợp lệ')
      return
    }
    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu')
      return
    }
    if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp')
      return
    }
    
    try{
      console.log('Register attempt', { email, role })
      await createUser({ name, phone, email, password, role })
      console.log('Register success', { email })
      setSuccess('✅ Đăng ký thành công! Đang chuyển đến trang đăng nhập...')
      setTimeout(()=>navigate('/login'), 1500)
    }catch(err){
      console.error('Register error', err)
      const code = err && err.error
      if (code === 'invalid_email') setEmailError('Email không hợp lệ')
      else if (code === 'password_too_short') setPasswordError('Mật khẩu phải có ít nhất 6 ký tự')
      else if (code === 'email already in use') setEmailError('Email đã được sử dụng')
      else setError('❌ Đăng ký thất bại. Vui lòng thử lại.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        {/* Card với hiệu ứng glass */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header với animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4 shadow-lg animate-bounce">
              <span className="text-4xl">🎓</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Tạo tài khoản mới
            </h2>
            <p className="text-gray-600">Đăng ký để theo dõi con bạn</p>
          </div>

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
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>👤</span> Họ và tên
              </label>
              <input 
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none" 
                placeholder="Nguyễn Văn A" 
                value={name} 
                onChange={e=>setName(e.target.value)} 
              />
            </div>

            {/* Phone Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>📱</span> Số điện thoại
              </label>
              <input 
                type="tel"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none" 
                placeholder="0912345678" 
                value={phone} 
                onChange={e=>setPhone(e.target.value)} 
              />
            </div>

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
                    : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                }`}
                placeholder="example@email.com" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
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
                    : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                }`}
                placeholder="Ít nhất 6 ký tự" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
              />
              {passwordError && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>🔐</span> Xác nhận mật khẩu
              </label>
              <input 
                type="password"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none ${
                  confirmPasswordError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                }`}
                placeholder="Nhập lại mật khẩu" 
                value={confirmPassword} 
                onChange={e=>setConfirmPassword(e.target.value)} 
              />
              {confirmPasswordError && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Role Info (Auto Parent) */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
              <p className="text-sm text-purple-800 font-medium flex items-center gap-2">
                <span>👨‍👩‍👧</span> Bạn đang đăng ký với vai trò <strong>Phụ huynh</strong>
              </p>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Đăng ký ngay 🚀
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

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Đã có tài khoản?{' '}
                <Link 
                  to="/login" 
                  className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <a href="#" className="text-purple-600 hover:underline">Điều khoản dịch vụ</a>
          {' '}và{' '}
          <a href="#" className="text-purple-600 hover:underline">Chính sách bảo mật</a>
        </p>
      </div>
    </div>
  )
}
