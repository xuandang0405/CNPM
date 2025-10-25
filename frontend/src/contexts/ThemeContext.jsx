import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        // Check localStorage first, then system preference
        const stored = localStorage.getItem('theme')
        if (stored) {
            return stored === 'dark'
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    useEffect(() => {
        const root = window.document.documentElement
        
        if (isDark) {
            root.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            root.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [isDark])

    const toggleTheme = () => {
        setIsDark(prev => !prev)
    }

    const setTheme = (theme) => {
        setIsDark(theme === 'dark')
    }

    return (
        <ThemeContext.Provider value={{
            isDark,
            toggleTheme,
            setTheme,
            theme: isDark ? 'dark' : 'light'
        }}>
            {children}
        </ThemeContext.Provider>
    )
}