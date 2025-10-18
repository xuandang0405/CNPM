import { useCallback } from 'react'
import useUserStore from '../store/useUserStore'

// Mocked useAuth hook. In real app, call backend for token and user info.
export function useAuth() {
  const { user, setUser, clearUser } = useUserStore()

  const login = useCallback(async ({ username, password }) => {
    // Mock: accept any credentials and assign role based on username prefix
    const role = username.startsWith('admin') ? 'admin' : username.startsWith('driver') ? 'driver' : 'parent'
    const token = 'mock-token-' + Math.random().toString(36).slice(2)
    const userInfo = { username, role, token }
    setUser(userInfo)
    return userInfo
  }, [setUser])

  const logout = useCallback(() => {
    clearUser()
  }, [clearUser])

  return { user, login, logout }
}
