import React, { useState, useRef, useEffect } from 'react'
import { Languages, ChevronDown } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

const LABELS = {
  vi: { name: 'Tiếng Việt', flag: '🇻🇳' },
  en: { name: 'English', flag: '🇬🇧' },
  fr: { name: 'Français', flag: '🇫🇷' },
  es: { name: 'Español', flag: '🇪🇸' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  ja: { name: '日本語', flag: '🇯🇵' },
  ko: { name: '한국어', flag: '🇰🇷' },
  zh: { name: '中文', flag: '🇨🇳' },
  th: { name: 'ไทย', flag: '🇹🇭' },
}

export default function LanguageSwitcher({ className = '', variant = 'chip' }){
  const { language, languages = ['vi','en'], changeLanguage, toggleLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const current = LABELS[language] || { name: language.toUpperCase(), flag: '🌐' }

  // Two visual variants: 'chip' (compact pill) and 'action' (full-width quick action style)
  const isAction = variant === 'action'

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        onDoubleClick={toggleLanguage}
        className={
          isAction
            ? `w-full flex items-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-md group`
            : `flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 hover:shadow-md transition-all duration-200`
        }
        title="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div
          className={
            isAction
              ? `p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 mr-3 group-hover:scale-110 transition-transform duration-200`
              : ''
          }
        >
          <Languages className={isAction ? `h-5 w-5 text-indigo-600` : `w-5 h-5 text-purple-600 dark:text-purple-400`} />
        </div>
        <span className={isAction ? `flex-1 text-left` : `text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1`}>
          {isAction ? (
            <span className="flex items-center gap-1">
              <span>{current.flag}</span> {current.name}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span>{current.flag}</span> {current.name}
            </span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute ${isAction ? 'left-0 right-0' : 'right-0'} mt-2 ${isAction ? 'w-full' : 'w-44'} rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl z-50`}
        >
          {languages.map(code => {
            const info = LABELS[code] || { name: code.toUpperCase(), flag: '🌐' }
            const active = code === language
            return (
              <li
                key={code}
                role="option"
                aria-selected={active}
                onClick={() => { changeLanguage(code); setOpen(false) }}
                className={`px-3 py-2 cursor-pointer flex items-center gap-2 text-sm ${active ? 'bg-purple-50 dark:bg-purple-900/30 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-700/60'}`}
              >
                <span>{info.flag}</span>
                <span className="text-gray-800 dark:text-gray-100">{info.name}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
