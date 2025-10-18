import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import useUserStore from './store/useUserStore'

function ThemeApplier({ children }){
  const { theme } = useUserStore()
  React.useEffect(()=>{
    try{ document.documentElement.setAttribute('data-theme', theme) }catch(e){}
  },[theme])
  return children
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeApplier>
        <App />
      </ThemeApplier>
    </BrowserRouter>
  </React.StrictMode>
)
