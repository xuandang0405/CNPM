import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'

export default function ThemeSwitcher() {
    const { isDark, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="relative inline-flex h-10 w-20 items-center justify-center rounded-full 
                     bg-gradient-to-r from-purple-400 to-pink-400 dark:from-blue-600 dark:to-purple-600 
                     transition-all duration-300 ease-in-out transform hover:scale-105 
                     focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-blue-800 
                     shadow-lg hover:shadow-xl"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <div
                className={`absolute left-1 top-1 h-8 w-8 rounded-full bg-white dark:bg-gray-800 
                          transition-transform duration-300 ease-in-out shadow-md
                          ${isDark ? 'translate-x-10' : 'translate-x-0'}`}
            >
                <div className="flex h-full w-full items-center justify-center">
                    {isDark ? (
                        <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="h-4 w-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                    )}
                </div>
            </div>
        </button>
    )
}
