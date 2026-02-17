import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importa la funzione di registrazione PWA
import { registerSW } from 'virtual:pwa-register'

// Registra il Service Worker con aggiornamento automatico
const updateSW = registerSW({
  onNeedRefresh() {
    // Quando c'è una nuova versione, ricarica la pagina automaticamente
    if (confirm("Nuova versione disponibile. Ricaricare?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("App pronta per l'uso offline!");
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
