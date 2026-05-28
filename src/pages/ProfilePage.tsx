import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Calendar, Award, TrendingUp, BookOpen, Briefcase, Bell, Shield, Moon, Globe, Sun, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/button'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [editingJobTitle, setEditingJobTitle] = useState(false)
  const [jobTitleInput, setJobTitleInput] = useState('')
  const [openSetting, setOpenSetting] = useState<string | null>(null)

  // Settings state
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifInApp, setNotifInApp] = useState(true)
  const [notifSessions, setNotifSessions] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [timezone, setTimezone] = useState('America/Denver')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  const [twoFactor, setTwoFactor] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))

    const savedJobTitle = localStorage.getItem('staffJobTitle')
    if (savedJobTitle) { setJobTitle(savedJobTitle); setJobTitleInput(savedJobTitle) }

    const saved = localStorage.getItem('profileSettings')
    if (saved) {
      const s = JSON.parse(saved)
      if (s.notifEmail !== undefined) setNotifEmail(s.notifEmail)
      if (s.notifInApp !== undefined) setNotifInApp(s.notifInApp)
      if (s.notifSessions !== undefined) setNotifSessions(s.notifSessions)
      if (s.darkMode !== undefined) {
        setDarkMode(s.darkMode)
        document.documentElement.classList.toggle('dark', s.darkMode)
      }
      if (s.timezone) setTimezone(s.timezone)
      if (s.dateFormat) setDateFormat(s.dateFormat)
      if (s.twoFactor !== undefined) setTwoFactor(s.twoFactor)
    }
  }, [])

  const saveSettings = (updates: object) => {
    const saved = localStorage.getItem('profileSettings')
    const current = saved ? JSON.parse(saved) : {}
    localStorage.setItem('profileSettings', JSON.stringify({ ...current, ...updates }))
  }

  const saveJobTitle = () => {
    setJobTitle(jobTitleInput)
    localStorage.setItem('staffJobTitle', jobTitleInput)
    setEditingJobTitle(false)
  }

  const toggleSetting = (key: string) => setOpenSetting(prev => prev === key ? null : key)

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>
  }

  const isStaff = user.type === 'staff' || user.type === 'admin'

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )

  const settingsRows = [
    {
      key: 'notifications',
      icon: Bell,
      label: 'Notifications',
      sub: 'Manage email and in-app alerts',
      color: 'bg-blue-100 text-blue-600',
      content: (
        <div className="space-y-4">
          {[
            { label: 'Email notifications', sub: 'Receive updates via email', val: notifEmail, set: (v: boolean) => { setNotifEmail(v); saveSettings({ notifEmail: v }) } },
            { label: 'In-app alerts', sub: 'Show alerts inside the platform', val: notifInApp, set: (v: boolean) => { setNotifInApp(v); saveSettings({ notifInApp: v }) } },
            { label: 'Session reminders', sub: 'Notify before upcoming sessions', val: notifSessions, set: (v: boolean) => { setNotifSessions(v); saveSettings({ notifSessions: v }) } },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
              <Toggle checked={item.val} onChange={item.set} />
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'security',
      icon: Shield,
      label: 'Privacy & Security',
      sub: 'Password, two-factor authentication',
      color: 'bg-green-100 text-green-600',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Two-factor authentication</p>
              <p className="text-xs text-gray-500">Add an extra layer of security</p>
            </div>
            <Toggle checked={twoFactor} onChange={(v) => { setTwoFactor(v); saveSettings({ twoFactor: v }) }} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">Change password</p>
            <div className="space-y-2">
              <input type="password" placeholder="Current password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" placeholder="New password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <Button size="sm" className="w-full">Update Password</Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'appearance',
      icon: Moon,
      label: 'Appearance',
      sub: 'Theme and display preferences',
      color: 'bg-purple-100 text-purple-600',
      content: (
        <div>
          <p className="text-sm font-medium text-gray-900 mb-3">Theme</p>
          <div className="flex gap-3">
            {[{ label: 'Light', icon: Sun, val: false }, { label: 'Dark', icon: Moon, val: true }].map(opt => (
              <button key={opt.label} onClick={() => { setDarkMode(opt.val); saveSettings({ darkMode: opt.val }); document.documentElement.classList.toggle('dark', opt.val) }}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${darkMode === opt.val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <opt.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'locale',
      icon: Globe,
      label: 'Language & Region',
      sub: 'Timezone, date format, and locale',
      color: 'bg-orange-100 text-orange-600',
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-1">Timezone</label>
            <select value={timezone} onChange={(e) => { setTimezone(e.target.value); saveSettings({ timezone: e.target.value }) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-1">Date Format</label>
            <select value={dateFormat} onChange={(e) => { setDateFormat(e.target.value); saveSettings({ dateFormat: e.target.value }) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-4xl font-bold text-white">{user.name?.[0]}</span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white" />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{user.name}</h1>

                {/* Job title — staff only */}
                {isStaff && (
                  <div className="mb-3">
                    {editingJobTitle ? (
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <input
                          type="text"
                          value={jobTitleInput}
                          onChange={(e) => setJobTitleInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveJobTitle()}
                          placeholder="e.g., Program Coordinator"
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                          autoFocus
                        />
                        <Button size="sm" onClick={saveJobTitle}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingJobTitle(false); setJobTitleInput(jobTitle) }}>Cancel</Button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingJobTitle(true)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 justify-center md:justify-start group">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm">{jobTitle || 'Add job title…'}</span>
                        <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 text-gray-600 mb-4">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Joined {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${isStaff ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {isStaff ? 'Staff Member' : 'Student'}
                </span>
              </div>

              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                onClick={() => isStaff ? setEditingJobTitle(true) : undefined}
              >
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Student-only: stats + activity */}
          {!isStaff && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {[
                  { icon: BookOpen, value: '5', label: 'Courses Enrolled', bg: 'bg-blue-100', color: 'text-blue-600', delay: 0.1 },
                  { icon: TrendingUp, value: '92%', label: 'Attendance Rate', bg: 'bg-green-100', color: 'text-green-600', delay: 0.2 },
                  { icon: Award, value: '850', label: 'Engagement Score', bg: 'bg-purple-100', color: 'text-purple-600', delay: 0.3 },
                ].map((stat) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: stat.delay }} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }} className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  {[
                    { action: 'Attended', item: 'Introduction to React', time: '2 hours ago', color: 'blue' },
                    { action: 'Completed', item: 'JavaScript Fundamentals Quiz', time: '1 day ago', color: 'green' },
                    { action: 'Joined', item: 'Advanced TypeScript Session', time: '3 days ago', color: 'purple' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full bg-${activity.color}-500`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action} <span className="text-gray-600">{activity.item}</span>
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {/* Settings — visible to all roles */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }} className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <div className="divide-y divide-gray-100">
              {settingsRows.map((row) => (
                <div key={row.key}>
                  <button onClick={() => toggleSetting(row.key)}
                    className="w-full flex items-center gap-4 py-4 hover:bg-gray-50 transition-colors rounded-lg px-2 text-left">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${row.color}`}>
                      <row.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{row.label}</p>
                      <p className="text-sm text-gray-500">{row.sub}</p>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${openSetting === row.key ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openSetting === row.key && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-4 pt-2">
                          {row.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
