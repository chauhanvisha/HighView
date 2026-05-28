import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { SemesterProvider } from './contexts/SemesterContext'
import { SettingsProvider } from './contexts/SettingsContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <SemesterProvider>
          <App />
        </SemesterProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
