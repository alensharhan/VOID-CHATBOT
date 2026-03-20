import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Automatically register the background PWA service worker so we can run 100% offline 
registerSW({
  onNeedRefresh() {},
  onOfflineReady() {
    console.log("VOID is fully cached and ready for offline Airplane Mode.");
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
