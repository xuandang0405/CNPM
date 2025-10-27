import { useCallback } from 'react'
import { useUserStore } from '../store/useUserStore'
import { loginUser } from '../api/users'

export function useAuth() {
  const { user, setUser, clearUser } = useUserStore()

  const login = useCallback(async ({ email, password }) => {
    const data = await loginUser({ email, password })
    
    // Check if user must change password before login
    if (data.require_password_change) {
      // Clear any existing session/local tokens to avoid mixing identities
      try {
        sessionStorage.removeItem('token'); sessionStorage.removeItem('user')
        localStorage.removeItem('token'); localStorage.removeItem('user')
      } catch(e) {}

      // Store the temporary token for password change in sessionStorage only
      try { if (data.token) sessionStorage.setItem('token', data.token) } catch(e) {}

      return { 
        must_change_password: true, 
        message: data.message,
        user_id: data.user_id,
        email: data.email
      }
    }
    
    const userInfo = { id: data.id, email: data.email, token: data.token, role: data.role }
    // setUser will handle saving to both sessionStorage and localStorage
    setUser(userInfo)
    return userInfo
  }, [setUser])

  const logout = useCallback(() => {
    clearUser()
  }, [clearUser])

  return { user, login, logout }
}
