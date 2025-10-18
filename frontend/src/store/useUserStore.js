import create from 'zustand'

const initialLang = (() => {
  try { return localStorage.getItem('lang') || 'vi' } catch(e){ return 'vi' }
})()

const initialTheme = (() => {
  try { return localStorage.getItem('theme') || 'light' } catch(e){ return 'light' }
})()

const useUserStore = create(set => ({
  user: null,
  lang: initialLang,
  theme: initialTheme,
  setUser: user => set({ user }),
  clearUser: () => set({ user: null }),
  setLang: (lang) => { try{ localStorage.setItem('lang', lang) }catch(e){}; set({ lang }) }
  ,
  setTheme: (theme) => { try{ localStorage.setItem('theme', theme) }catch(e){}; set({ theme }) }
}))

export default useUserStore
