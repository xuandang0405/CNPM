import React from 'react'
import { Languages } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

export default function LanguageSwitcher({ className = '' }){
  const { language, toggleLanguage } = useLanguage()
  
  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 hover:shadow-md transition-all duration-200 transform hover:scale-105 ${className}`}
      title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      <Languages className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {language === 'vi' ? '🇬🇧 EN' : '🇻🇳 VI'}
      </span>
    </button>
  )
}
