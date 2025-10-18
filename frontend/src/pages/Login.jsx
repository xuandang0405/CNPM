import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import useUserStore from '../store/useUserStore'
import { t } from '../i18n'
import Button from '../components/common/Button'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    const user = await login({ username, password })
    if (user.role === 'admin') navigate('/admin')
    else if (user.role === 'driver') navigate('/driver')
    else navigate('/parent')
  }

  const { lang } = useUserStore()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="heading mb-2">{t(lang,'login')}</h2>
              <p className="muted mb-4">{t(lang,'login')} {t(lang,'message')}</p>
            </div>
            <div>
              <LanguageSwitcher />
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">{t(lang,'username') || 'Tài khoản'}</label>
              <input className="form-input" value={username} onChange={e=>setUsername(e.target.value)} placeholder={t(lang,'username_placeholder') || 'Tên đăng nhập hoặc email'} />
            </div>
            <div>
              <label className="block text-sm mb-1">{t(lang,'password') || 'Mật khẩu'}</label>
              <input type="password" className="form-input" value={password} onChange={e=>setPassword(e.target.value)} placeholder={t(lang,'password_placeholder') || 'Mật khẩu'} />
            </div>
            <div className="flex items-center justify-between">
              <Link className="text-sm text-blue-600" to="/register">{t(lang,'register')}</Link>
              <Button type="submit">{t(lang,'login')}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
