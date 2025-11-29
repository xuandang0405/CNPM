import React, { useState, useEffect } from 'react'
import { changePassword, changePasswordPublic } from '../api/users'
import { useNavigate, useLocation } from 'react-router-dom'

export default function ChangePassword(){
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if this is first login requiring password change
  const isFirstLogin = location.state?.isFirstLogin || false
  const initialMessage = location.state?.message || null
  const userEmail = location.state?.email || null
  const hasAuthToken = (() => {
    try { return !!(sessionStorage.getItem('token') || localStorage.getItem('token')) } catch(e){ return false }
  })()

  async function handleSubmit(e){
    e.preventDefault()
    setStatus(null)
    if (!currentPassword || !newPassword) return setStatus({ type:'error', message: 'Vui lòng nhập đầy đủ' })
    if (newPassword.length < 6) return setStatus({ type:'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
    if (newPassword !== confirmPassword) return setStatus({ type:'error', message: 'Xác nhận mật khẩu không khớp' })
    try{
      setLoading(true)
      if (isFirstLogin || hasAuthToken) {
        await changePassword({ current_password: currentPassword, new_password: newPassword })
      } else {
        // public flow requires email input
        const emailInput = (document.getElementById('cp-email-input') || { value: '' }).value.trim()
        if (!/^\S+@\S+\.\S+$/.test(emailInput)){
          setStatus({ type:'error', message: 'Vui lòng nhập email hợp lệ' })
          setLoading(false)
          return
        }
        await changePasswordPublic({ email: emailInput, current_password: currentPassword, new_password: newPassword })
      }
      setStatus({ type: 'success', message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' })
      // Clear any temporary tokens and user info after password change
      try {
        sessionStorage.removeItem('token'); sessionStorage.removeItem('user')
        localStorage.removeItem('token'); localStorage.removeItem('user')
      } catch(e) {}
      setTimeout(()=>navigate('/login'), 1200)
    }catch(err){
      console.error('change password error', err)
      const code = err && err.error
      if (code === 'invalid_credentials') setStatus({ type:'error', message: 'Mật khẩu hiện tại không đúng' })
      else if (code === 'missing_token' || code === 'invalid_token') setStatus({ type:'error', message: 'Phiên đổi mật khẩu đã hết hạn. Vui lòng đăng nhập lại.' })
      else setStatus({ type:'error', message: 'Đổi mật khẩu thất bại' })
    }finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isFirstLogin ? 'Đổi mật khẩu bắt buộc' : 'Đổi mật khẩu'}
            </h2>
            {isFirstLogin && userEmail && (
              <p className="text-sm text-gray-600 mt-2">
                Xin chào <strong>{userEmail}</strong><br/>
                Bạn cần đổi mật khẩu để tiếp tục sử dụng hệ thống.
              </p>
            )}
          </div>

          {initialMessage && (
            <div className="mb-4 p-3 rounded bg-yellow-50 text-yellow-700 text-sm">
              {initialMessage}
            </div>
          )}

          {!isFirstLogin && !hasAuthToken && (
            <div className="mb-4 p-3 rounded bg-blue-50 text-blue-700 text-sm">
              Bạn có thể đổi mật khẩu bằng cách nhập Email + mật khẩu hiện tại + mật khẩu mới. Hoặc đăng nhập trước, hay dùng chức năng "Quên mật khẩu" để yêu cầu đặt lại.
            </div>
          )}

          {status && (
            <div className={`mb-4 p-3 rounded ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isFirstLogin && !hasAuthToken && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email tài khoản</label>
                <input id="cp-email-input" type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="example@email.com" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isFirstLogin ? 'Mật khẩu tạm thời (số điện thoại)' : 'Mật khẩu hiện tại'}
              </label>
              <input 
                value={currentPassword} 
                onChange={e=>setCurrentPassword(e.target.value)} 
                type="password" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder={isFirstLogin ? "Nhập số điện thoại của bạn" : "Nhập mật khẩu hiện tại"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
              <input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="password" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nhập mật khẩu mới" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
              <input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type="password" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nhập lại mật khẩu mới" />
            </div>

            <button 
              disabled={loading || (!isFirstLogin && !hasAuthToken)} 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 hover:shadow-lg transition-all"
            >
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
