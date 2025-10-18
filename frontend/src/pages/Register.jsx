import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import { createUser } from '../api/users'
import { t } from '../i18n'
import useUserStore from '../store/useUserStore'

export default function Register(){
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('parent')
  const navigate = useNavigate()
  const { lang } = useUserStore()

  async function handleSubmit(e){
    e.preventDefault()
    // mock API
    await createUser({ name, phone, email, password, role })
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100">
      <div className="w-full max-w-md">
        <div className="card">
          <h2 className="heading mb-2">{t(lang, 'register') || 'Đăng ký tài khoản'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">{t(lang, 'name') || 'Họ và tên'}</label>
              <input className="form-input" placeholder={t(lang, 'name') || 'Họ và tên'} value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">{t(lang, 'phone') || 'Số điện thoại'}</label>
              <input className="form-input" placeholder={t(lang, 'phone') || 'Số điện thoại'} value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">{t(lang, 'email') || 'Email'}</label>
              <input className="form-input" placeholder={t(lang, 'email') || 'Email'} value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">{t(lang, 'password') || 'Mật khẩu'}</label>
              <input type="password" className="form-input" placeholder={t(lang, 'password_placeholder') || 'Mật khẩu'} value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">{t(lang, 'role') || 'Vai trò'}</label>
              <select className="form-input" value={role} onChange={e=>setRole(e.target.value)}>
                <option value="parent">{t(lang, 'parent_role') || 'Phụ huynh'}</option>
                <option value="driver">{t(lang, 'driver_role') || 'Tài xế'}</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <Button type="submit">{t(lang, 'register') || 'Đăng ký'}</Button>
              <Button variant="secondary" type="button" onClick={()=>navigate('/login')}>{t(lang, 'back') || 'Quay lại'}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
