import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Settings {
  notifEmail: boolean
  notifInApp: boolean
  notifSessions: boolean
  darkMode: boolean
  timezone: string
  dateFormat: string
  twoFactor: boolean
}

const DEFAULTS: Settings = {
  notifEmail: true,
  notifInApp: true,
  notifSessions: false,
  darkMode: false,
  timezone: 'America/Denver',
  dateFormat: 'MM/DD/YYYY',
  twoFactor: false,
}

interface SettingsContextType {
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  formatDate: (date: Date) => string
  formatTime: (date: Date) => string
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('profileSettings')
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS
    } catch {
      return DEFAULTS
    }
  })

  // Apply dark mode whenever it changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode)
  }, [settings.darkMode])

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem('profileSettings', JSON.stringify(next))
      return next
    })
  }

  const formatDate = (date: Date): string => {
    try {
      const opts: Intl.DateTimeFormatOptions = {
        timeZone: settings.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }
      const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(date)
      const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
      switch (settings.dateFormat) {
        case 'DD/MM/YYYY': return `${get('day')}/${get('month')}/${get('year')}`
        case 'YYYY-MM-DD': return `${get('year')}-${get('month')}-${get('day')}`
        default: return `${get('month')}/${get('day')}/${get('year')}`
      }
    } catch {
      return date.toLocaleDateString()
    }
  }

  const formatTime = (date: Date): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: settings.timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date)
    } catch {
      return date.toLocaleTimeString()
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, formatDate, formatTime }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
