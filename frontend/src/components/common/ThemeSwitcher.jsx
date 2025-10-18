import React from 'react'
import useUserStore from '../../store/useUserStore'

export default function ThemeSwitcher(){
  const { theme, setTheme } = useUserStore()
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  return (
    <button className="px-3 py-1 border rounded" onClick={toggle}>{theme === 'dark' ? '🌙' : '☀️'}</button>
  )
}
