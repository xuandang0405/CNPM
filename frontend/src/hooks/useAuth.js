import { useCallback } from 'react'
import { useUserStore } from '../store/useUserStore'
import { loginUser } from '../api/users'

export function useAuth() {
  const { user, setUser, clearUser } = useUserStore()

  const login = useCallback(async ({ email, password }) => {
    const data = await loginUser({ email, password })
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
