import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { resetPassword } from '../api/users'
import { useUserStore } from '../store/useUserStore'
import { t } from '../i18n'

export default function ResetPassword(){
  const { lang } = useUserStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = useMemo(()=> params.get('token') || '', [params])
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tokenOk, setTokenOk] = useState(!!token)

  useEffect(()=>{
    // If no token present in URL
    if (!token) setTokenOk(false)
  }, [token])

  async function onSubmit(e){
    e.preventDefault()
    setStatus(null)
    if (!token){
      setStatus({ type: 'error', message: t(lang, 'invalid_or_expired_link') })
      return
    }
    if (pwd.length < 8){
      setStatus({ type: 'error', message: lang === 'vi' ? 'Mật khẩu tối thiểu 8 ký tự' : 'Minimum 8 characters' })
      return
    }
    if (pwd !== pwd2){
      setStatus({ type: 'error', message: t(lang, 'passwords_do_not_match') })
      return
    }
    try{
      setLoading(true)
      await resetPassword({ token, new_password: pwd })
      setStatus({ type: 'success', message: t(lang, 'password_updated_success') })
      // redirect to login after short delay
      setTimeout(()=> navigate('/login', { replace: true }), 1200)
    }catch(err){
      console.error('reset password error', err)
      const code = err?.error
      if (code === 'invalid_token' || code === 'token_used' || code === 'token_expired'){
        setStatus({ type: 'error', message: t(lang, 'invalid_or_expired_link') })
      } else if (code === 'password_too_weak'){
        setStatus({ type: 'error', message: lang === 'vi' ? 'Mật khẩu tối thiểu 8 ký tự' : 'Minimum 8 characters' })
      } else {
        setStatus({ type: 'error', message: lang === 'vi' ? 'Có lỗi xảy ra, vui lòng thử lại sau.' : 'Something went wrong. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t(lang, 'reset_password')}</h2>
          {!tokenOk && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200">{t(lang, 'invalid_or_expired_link')}</div>
          )}
          {status && (
            <div className={`mb-4 p-3 rounded ${status.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200'}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t(lang, 'enter_new_password')}</label>
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100" placeholder="********" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t(lang, 'confirm_password')}</label>
              <input type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100" placeholder="********" />
            </div>

            <button disabled={!tokenOk || loading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded">
              {loading ? t(lang, 'processing') : t(lang, 'set_new_password')}
            </button>

            <div className="text-center mt-3">
              <Link to="/login" className="text-blue-600 hover:underline">{t(lang,'back_to_login')}</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
