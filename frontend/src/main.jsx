import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { useUserStore } from './store/useUserStore'
import ErrorBoundary from './components/common/ErrorBoundary'
import { LanguageProvider } from './contexts/LanguageContext'

function ThemeApplier({ children }){
  const { theme } = useUserStore()
  React.useEffect(()=>{
    try{ document.documentElement.setAttribute('data-theme', theme) }catch(e){}
  },[theme])
  return children
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <ThemeApplier>
            <App />
          </ThemeApplier>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
