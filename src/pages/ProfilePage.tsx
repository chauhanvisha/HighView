import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Calendar, Bell, Shield, Moon, Globe, Sun, ChevronRight, CheckCircle,
  Briefcase, MapPin, Phone, GraduationCap, BookOpen, Tag, Edit2, X, Link as LinkIcon,
  Github,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { useSettings } from '../contexts/SettingsContext'

// ── Shared Toggle ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

// ── Student profile data ──────────────────────────────────────────────────
interface StudentProfileData {
  bio: string
  school: string
  major: string
  classYear: string
  gpa: string
  location: string
  phone: string
  linkedin: string
  github: string
  skills: string
}

const DEFAULT_STUDENT_PROFILE: StudentProfileData = {
  bio: '',
  school: 'University of Colorado',
  major: '',
  classYear: '',
  gpa: '',
  location: '',
  phone: '',
  linkedin: '',
  github: '',
  skills: '',
}

const CLASS_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']

function loadStudentProfile(): StudentProfileData {
  try {
    const raw = localStorage.getItem('studentProfileData')
    return raw ? { ...DEFAULT_STUDENT_PROFILE, ...JSON.parse(raw) } : DEFAULT_STUDENT_PROFILE
  } catch {
    return DEFAULT_STUDENT_PROFILE
  }
}

// ── Student Profile Card ──────────────────────────────────────────────────
function StudentProfileSection({ user }: { user: any }) {
  const [profile, setProfile] = useState<StudentProfileData>(loadStudentProfile)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<StudentProfileData>(profile)

  const openEdit = () => { setDraft(profile); setEditing(true) }
  const closeEdit = () => setEditing(false)
  const saveEdit = () => {
    setProfile(draft)
    localStorage.setItem('studentProfileData', JSON.stringify(draft))
    setEditing(false)
  }

  const skills = profile.skills
    ? profile.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <>
      {/* ── Header card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-5">
        {/* Cover banner */}
        <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Avatar + name row */}
        <div className="px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 mb-4">
            <div className="relative w-28 h-28 shrink-0">
              {user.picture ? (
                <img src={user.picture} alt={user.name}
                  className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover" />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{user.name?.[0]}</span>
                </div>
              )}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
            </div>

            <Button
              onClick={openEdit}
              variant="outline"
              className="flex items-center gap-2 self-end sm:self-auto"
            >
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>

          {/* Name + badges */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>

          {/* Headline row */}
          {(profile.major || profile.classYear) && (
            <p className="text-base text-gray-600 mb-2">
              {[profile.major, profile.classYear].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* School */}
          {profile.school && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>{profile.school}</span>
            </div>
          )}

          {/* Location */}
          {profile.location && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{profile.location}</span>
            </div>
          )}

          {/* Email */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
            <Mail className="h-4 w-4 shrink-0" />
            <span>{user.email}</span>
          </div>

          {/* Role badge */}
          <div className="mt-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              Student
            </span>
          </div>
        </div>
      </div>

      {/* ── About ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
        {profile.bio ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
        ) : (
          <button onClick={openEdit} className="text-sm text-blue-600 hover:underline">
            + Add a bio
          </button>
        )}
      </div>

      {/* ── Education ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Education</h2>
        {(profile.school || profile.major || profile.classYear) ? (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <GraduationCap className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile.school || '—'}</p>
              {profile.major && <p className="text-sm text-gray-600">{profile.major}</p>}
              <div className="flex flex-wrap gap-3 mt-1">
                {profile.classYear && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {profile.classYear}
                  </span>
                )}
                {profile.gpa && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    GPA: {profile.gpa}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button onClick={openEdit} className="text-sm text-blue-600 hover:underline">
            + Add education
          </button>
        )}
      </div>

      {/* ── Skills & Interests ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-gray-500" />
          Skills &amp; Interests
        </h2>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill}
                className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <button onClick={openEdit} className="text-sm text-blue-600 hover:underline">
            + Add skills &amp; interests
          </button>
        )}
      </div>

      {/* ── Contact Info ──────────────────────────────────────────────── */}
      {(profile.phone || profile.linkedin || profile.github) && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-3">
            {profile.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.linkedin && (
              <div className="flex items-center gap-3 text-sm">
                <LinkIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate">
                  {profile.linkedin}
                </a>
              </div>
            )}
            {profile.github && (
              <div className="flex items-center gap-3 text-sm">
                <Github className="h-4 w-4 text-gray-400 shrink-0" />
                <a href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate">
                  {profile.github}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={closeEdit} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                <button onClick={closeEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={draft.bio}
                    onChange={e => setDraft(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell your story — background, interests, goals…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* School + Major row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                    <input type="text" value={draft.school}
                      onChange={e => setDraft(p => ({ ...p, school: e.target.value }))}
                      placeholder="University name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                    <input type="text" value={draft.major}
                      onChange={e => setDraft(p => ({ ...p, major: e.target.value }))}
                      placeholder="e.g. Computer Science"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {/* Class Year + GPA row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Year</label>
                    <select value={draft.classYear}
                      onChange={e => setDraft(p => ({ ...p, classYear: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select year</option>
                      {CLASS_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GPA (optional)</label>
                    <input type="text" value={draft.gpa}
                      onChange={e => setDraft(p => ({ ...p, gpa: e.target.value }))}
                      placeholder="e.g. 3.7"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={draft.location}
                    onChange={e => setDraft(p => ({ ...p, location: e.target.value }))}
                    placeholder="City, State"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills &amp; Interests
                    <span className="text-gray-400 font-normal ml-1">(comma-separated)</span>
                  </label>
                  <input type="text" value={draft.skills}
                    onChange={e => setDraft(p => ({ ...p, skills: e.target.value }))}
                    placeholder="Python, Data Analysis, Public Speaking…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={draft.phone}
                    onChange={e => setDraft(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* LinkedIn + GitHub */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                    <input type="url" value={draft.linkedin}
                      onChange={e => setDraft(p => ({ ...p, linkedin: e.target.value }))}
                      placeholder="linkedin.com/in/you"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                    <input type="text" value={draft.github}
                      onChange={e => setDraft(p => ({ ...p, github: e.target.value }))}
                      placeholder="username or URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button className="flex-1" onClick={saveEdit}>Save Changes</Button>
                <Button variant="outline" className="flex-1" onClick={closeEdit}>Cancel</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Main ProfilePage ───────────────────────────────────────────────────────
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
    setTimeout(() => { setPwStatus('success'); setPwCurrent(''); setPwNew('') }, 600)
    setTimeout(() => setPwStatus('idle'), 3000)
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center"><p>Loading…</p></div>

  const isStaff = user.type === 'staff' || user.type === 'admin'

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
              <input type="password" placeholder="Current password" value={pwCurrent}
                onChange={e => { setPwCurrent(e.target.value); setPwStatus('idle') }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" placeholder="New password" value={pwNew}
                onChange={e => { setPwNew(e.target.value); setPwStatus('idle') }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <Button size="sm" className="w-full" onClick={handlePasswordChange}>Update Password</Button>
              {pwStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-sm">
                  <CheckCircle className="h-4 w-4" /> Password updated successfully
                </div>
              )}
              {pwStatus === 'error' && <p className="text-red-600 text-xs">Please fill in both fields.</p>}
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
              <button key={opt.label} onClick={() => updateSetting('darkMode', opt.val)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${settings.darkMode === opt.val ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
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
            <select value={settings.timezone} onChange={e => updateSetting('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Object.entries(tzLabels).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-1">Date Format</label>
            <select value={settings.dateFormat} onChange={e => updateSetting('dateFormat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
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

          {/* ── Staff: compact header card ──────────────────────────────── */}
          {isStaff && (
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

                  <div className="mb-3">
                    {editingJobTitle ? (
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <input type="text" value={jobTitleInput}
                          onChange={e => setJobTitleInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveJobTitle()}
                          placeholder="e.g., Program Coordinator"
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                          autoFocus />
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
                  <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                    Staff Member
                  </span>
                </div>

                <Button
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  onClick={() => setEditingJobTitle(true)}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          )}

          {/* ── Student: LinkedIn-style profile ────────────────────────── */}
          {!isStaff && <StudentProfileSection user={user} />}

          {/* ── Settings — all roles ────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }} className="bg-white rounded-2xl shadow-xl p-8">
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
