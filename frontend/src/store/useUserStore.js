import { create } from 'zustand'

const initialLang = (() => {
  try { return localStorage.getItem('lang') || 'vi' } catch(e){ return 'vi' }
})()

const initialTheme = (() => {
  try { return localStorage.getItem('theme') || 'light' } catch(e){ return 'light' }
})()

// Load user from sessionStorage (per-tab) first, fallback to localStorage
const initialUser = (() => {
  try {
    // Try sessionStorage first (per-tab session)
    let token = sessionStorage.getItem('token')
    let userStr = sessionStorage.getItem('user')
    
    // Fallback to localStorage (persistent across tabs)
    if (!token || !userStr) {
      token = localStorage.getItem('token')
      userStr = localStorage.getItem('user')
      
      // If found in localStorage, copy to sessionStorage for this tab
      if (token && userStr) {
        sessionStorage.setItem('token', token)
        sessionStorage.setItem('user', userStr)
      }
    }
    
    if (token && userStr) {
      const user = JSON.parse(userStr)
      return { ...user, token }
    }
  } catch(e) {
    console.error('Failed to load user from storage', e)
  }
  return null
})()

const useUserStore = create((set, get) => ({
  user: initialUser,
  lang: initialLang,
  theme: initialTheme,
  setUser: user => {
    // Save user to BOTH sessionStorage (current tab) and localStorage (persistent)
    try {
      if (user) {
        const { token, ...userWithoutToken } = user
        const userJson = JSON.stringify(userWithoutToken)
        
        // Save to sessionStorage (per-tab, won't affect other tabs)
        sessionStorage.setItem('user', userJson)
        sessionStorage.setItem('token', token)
        
        // Also save to localStorage for persistence (but other tabs use their own sessionStorage)
        localStorage.setItem('user', userJson)
        localStorage.setItem('token', token)
      } else {
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    } catch(e) {
      console.error('Failed to save user to storage', e)
    }
    set({ user })
  },
  clearUser: () => {
    try {
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    } catch(e) {}
    set({ user: null })
  },
  setLang: (lang) => { try{ localStorage.setItem('lang', lang) }catch(e){}; set({ lang }) },
  setTheme: (theme) => { try{ localStorage.setItem('theme', theme) }catch(e){}; set({ theme }) }
}))

export default useUserStore
export { useUserStore }
