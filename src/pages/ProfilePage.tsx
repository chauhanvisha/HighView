import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Calendar, Award, TrendingUp, BookOpen, Briefcase, Bell, Shield, Moon, Globe, Sun, ChevronRight, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useSettings } from '../contexts/SettingsContext'

export default function ProfilePage() {
  const { settings, updateSetting, formatDate, formatTime } = useSettings()
  const [user, setUser] = useState<any>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [editingJobTitle, setEditingJobTitle] = useState(false)
  const [jobTitleInput, setJobTitleInput] = useState('')
  const [openSetting, setOpenSetting] = useState<string | null>(null)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwStatus, setPwStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))
    const savedTitle = localStorage.getItem('staffJobTitle')
    if (savedTitle) { setJobTitle(savedTitle); setJobTitleInput(savedTitle) }
    // Live clock tick
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const saveJobTitle = () => {
    setJobTitle(jobTitleInput)
    localStorage.setItem('staffJobTitle', jobTitleInput)
    setEditingJobTitle(false)
  }

  const handlePasswordChange = () => {
    if (!pwCurrent || !pwNew) { setPwStatus('error'); return }
    // Mock: simulate success after 600ms
    setTimeout(() => { setPwStatus('success'); setPwCurrent(''); setPwNew('') }, 600)
    setTimeout(() => setPwStatus('idle'), 3000)
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>

  const isStaff = user.type === 'staff' || user.type === 'admin'

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )

  const tzLabels: Record<string, string> = {
    'America/Denver': 'Mountain Time (MT)',
    'America/Chicago': 'Central Time (CT)',
    'America/New_York': 'Eastern Time (ET)',
    'America/Los_Angeles': 'Pacific Time (PT)',
    'UTC': 'UTC',
  }

  const settingsRows = [
    {
      key: 'notifications',
      icon: Bell,
      label: 'Notifications',
      sub: `${[settings.notifEmail && 'Email', settings.notifInApp && 'In-app', settings.notifSessions && 'Session reminders'].filter(Boolean).join(', ') || 'All off'}`,
      color: 'bg-blue-100 text-blue-600',
      content: (
        <div className="space-y-4">
          {[
            { label: 'Email notifications', sub: 'Receive updates via email', key: 'notifEmail' as const, val: settings.notifEmail },
            { label: 'In-app alerts', sub: 'Show alerts and badge in the navbar', key: 'notifInApp' as const, val: settings.notifInApp },
            { label: 'Session reminders', sub: 'Notify before upcoming sessions', key: 'notifSessions' as const, val: settings.notifSessions },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
              <Toggle checked={item.val} onChange={(v) => updateSetting(item.key, v)} />
            </div>
          ))}
          {settings.notifInApp && (
            <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2">
              In-app alerts are on — check the bell icon in the navbar for notifications.
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'security',
      icon: Shield,
      label: 'Privacy & Security',
      sub: `2FA ${settings.twoFactor ? 'enabled' : 'disabled'}`,
      color: 'bg-green-100 text-green-600',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Two-factor authentication</p>
              <p className="text-xs text-gray-500">{settings.twoFactor ? 'Active — your account is more secure' : 'Add an extra layer of security'}</p>
            </div>
            <Toggle checked={settings.twoFactor} onChange={(v) => updateSetting('twoFactor', v)} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">Change password</p>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Current password"
                value={pwCurrent}
                onChange={e => { setPwCurrent(e.target.value); setPwStatus('idle') }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="New password"
                value={pwNew}
                onChange={e => { setPwNew(e.target.value); setPwStatus('idle') }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button size="sm" className="w-full" onClick={handlePasswordChange}>Update Password</Button>
              {pwStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-sm">
                  <CheckCircle className="h-4 w-4" /> Password updated successfully
                </div>
              )}
              {pwStatus === 'error' && (
                <p className="text-red-600 text-xs">Please fill in both fields.</p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'appearance',
      icon: Moon,
      label: 'Appearance',
      sub: settings.darkMode ? 'Dark mode' : 'Light mode',
      color: 'bg-purple-100 text-purple-600',
      content: (
        <div>
          <p className="text-sm font-medium text-gray-900 mb-3">Theme</p>
          <div className="flex gap-3">
            {[{ label: 'Light', icon: Sun, val: false }, { label: 'Dark', icon: Moon, val: true }].map(opt => (
              <button
                key={opt.label}
                onClick={() => updateSetting('darkMode', opt.val)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${settings.darkMode === opt.val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <opt.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Currently: <span className="font-medium">{settings.darkMode ? 'Dark' : 'Light'}</span> — changes apply immediately across the entire app.
          </p>
        </div>
      ),
    },
    {
      key: 'locale',
      icon: Globe,
      label: 'Language & Region',
      sub: `${tzLabels[settings.timezone] ?? settings.timezone} · ${settings.dateFormat}`,
      color: 'bg-orange-100 text-orange-600',
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-1">Timezone</label>
            <select
              value={settings.timezone}
              onChange={e => updateSetting('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(tzLabels).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-1">Date Format</label>
            <select
              value={settings.dateFormat}
              onChange={e => updateSetting('dateFormat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          {/* Live preview */}
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-orange-600 font-medium mb-1">Live preview</p>
            <p className="text-sm font-semibold text-orange-900">{formatDate(now)}</p>
            <p className="text-xs text-orange-700">{formatTime(now)} · {tzLabels[settings.timezone] ?? settings.timezone}</p>
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

                {isStaff && (
                  <div className="mb-3">
                    {editingJobTitle ? (
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <input
                          type="text"
                          value={jobTitleInput}
                          onChange={e => setJobTitleInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveJobTitle()}
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
                    <span className="text-sm">Joined {formatDate(new Date())}</span>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${isStaff ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {isStaff ? 'Staff Member' : 'Student'}
                </span>
              </div>

              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                onClick={() => isStaff && setEditingJobTitle(true)}
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
                ].map(stat => (
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

          {/* Settings — all roles */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }} className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <div className="divide-y divide-gray-100">
              {settingsRows.map(row => (
                <div key={row.key}>
                  <button onClick={() => setOpenSetting(prev => prev === row.key ? null : row.key)}
                    className="w-full flex items-center gap-4 py-4 hover:bg-gray-50 transition-colors rounded-lg px-2 text-left">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${row.color}`}>
                      <row.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{row.label}</p>
                      <p className="text-sm text-gray-500">{row.sub}</p>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${openSetting === row.key ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openSetting === row.key && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-5 pt-1">{row.content}</div>
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
