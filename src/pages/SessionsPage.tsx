import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, X, Users, Monitor, AlertCircle, CalendarPlus, ChevronDown, UserCheck, UserPlus, Edit, Trash2, BarChart3, Activity, ShieldAlert, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { addToCalendar } from '../utils/calendarUtils'
import { realStudents } from '../data/transformStudents'
import { SemesterSelector } from '../components/SemesterSelector'
import { useSemester } from '../contexts/SemesterContext'
import { getStatsBySemester } from '../data/semesterData'

function getRecentActivities(sessions: { title: string; date: string }[]) {
  return sessions.slice(-5).reverse().map(s => ({
    event: 'Session Created',
    detail: `${s.title} scheduled`,
    time: s.date,
  }))
}

interface Session {
  id: number
  title: string
  date: string
  time: string
  type: 'Virtual' | 'In-Person'
  instructor: string
  enrolled: number
  rsvps: number
  registrations?: string[] // Array of student IDs who registered
  requiredGrades?: string[]
}

export default function SessionsPage() {
  const [userRole, setUserRole] = useState<'staff' | 'student'>('student')
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState<number | null>(null)
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [sessionFormData, setSessionFormData] = useState({
    title: '',
    date: '',
    time: '',
    type: 'Virtual' as 'Virtual' | 'In-Person',
    instructor: '',
    requiredGrades: [] as string[],
  })
  const [customSessions, setCustomSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('sessions')
    return saved ? JSON.parse(saved) : []
  })
  const [sessionRegistrations, setSessionRegistrations] = useState<Record<number, string[]>>(() => {
    const saved = localStorage.getItem('sessionRegistrations')
    return saved ? JSON.parse(saved) : {}
  })
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [studentClassYear, setStudentClassYear] = useState<string>('')
  const [registeredStudentsModalOpen, setRegisteredStudentsModalOpen] = useState(false)
  const [selectedSessionForView, setSelectedSessionForView] = useState<Session | null>(null)

  const { selectedSemester } = useSemester()
  const stats = useMemo(() => getStatsBySemester(selectedSemester.id), [selectedSemester.id])

  // Generate sessions from real student data + custom sessions
  const sessions = useMemo(() => {
    const majors = [...new Set(realStudents.map(s => s.major))].slice(0, 3)
    const dates = ['Oct 28, 2025', 'Oct 30, 2025', 'Nov 2, 2025']
    const times = ['2:00 PM - 4:00 PM', '10:00 AM - 11:30 AM', '3:00 PM - 5:00 PM']
    const types = ['Virtual', 'Virtual', 'In-Person']
    
    const generatedSessions = majors.map((major, index) => {
      const studentsInMajor = realStudents.filter(s => s.major === major)
      const enrolled = studentsInMajor.length
      const rsvps = Math.floor(enrolled * 0.85)
      
      return {
        id: index + 1,
        title: `${major} Workshop`,
        date: dates[index],
        time: times[index],
        type: types[index] as 'Virtual' | 'In-Person',
        instructor: 'HighView Staff',
        enrolled,
        rsvps,
        requiredGrades: [] as string[],
      }
    })

    // Combine generated and custom sessions
    return [...generatedSessions, ...customSessions]
  }, [customSessions])

  // Save custom sessions to localStorage
  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(customSessions))
  }, [customSessions])

  // Save session registrations to localStorage
  useEffect(() => {
    localStorage.setItem('sessionRegistrations', JSON.stringify(sessionRegistrations))
  }, [sessionRegistrations])

  const handleRegisterForSession = (sessionId: number) => {
    if (!currentUser) return
    
    const studentId = currentUser.id || currentUser.email
    const currentRegistrations = sessionRegistrations[sessionId] || []
    
    if (currentRegistrations.includes(studentId)) {
      // Unregister
      setSessionRegistrations(prev => ({
        ...prev,
        [sessionId]: currentRegistrations.filter(id => id !== studentId)
      }))
    } else {
      // Register
      setSessionRegistrations(prev => ({
        ...prev,
        [sessionId]: [...currentRegistrations, studentId]
      }))
    }
  }

  const isRegistered = (sessionId: number) => {
    if (!currentUser) return false
    const studentId = currentUser.id || currentUser.email
    return (sessionRegistrations[sessionId] || []).includes(studentId)
  }

  const getRegistrationCount = (sessionId: number) => {
    return (sessionRegistrations[sessionId] || []).length
  }

  const getRegisteredStudents = (sessionId: number) => {
    const registeredIds = sessionRegistrations[sessionId] || []
    return realStudents.filter(student => registeredIds.includes(student.id))
  }

  const [sessionFormError, setSessionFormError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const handleAddSession = () => {
    if (!sessionFormData.title || !sessionFormData.date || !sessionFormData.time || !sessionFormData.instructor) {
      setSessionFormError('Please fill in all required fields: Title, Date, Time, and Instructor.')
      return
    }
    setSessionFormError(null)

    if (editingSession) {
      // Update existing session
      setCustomSessions(prev => prev.map(s => 
        s.id === editingSession.id 
          ? { ...editingSession, ...sessionFormData, enrolled: editingSession.enrolled, rsvps: editingSession.rsvps }
          : s
      ))
    } else {
      // Add new session
      const newSession: Session = {
        id: Date.now(),
        ...sessionFormData,
        enrolled: 0,
        rsvps: 0,
      }
      setCustomSessions(prev => [...prev, newSession])
    }

    // Reset form
    setSessionFormData({
      title: '',
      date: '',
      time: '',
      type: 'Virtual',
      instructor: '',
      requiredGrades: [],
    })
    setEditingSession(null)
    setSessionModalOpen(false)
  }

  const handleEditSession = (session: Session) => {
    setEditingSession(session)
    setSessionFormData({
      title: session.title,
      date: session.date,
      time: session.time,
      type: session.type,
      instructor: session.instructor,
      requiredGrades: session.requiredGrades || [],
    })
    setSessionModalOpen(true)
  }

  const handleDeleteSession = (sessionId: number) => {
    setCustomSessions(prev => prev.filter(s => s.id !== sessionId))
    setSessionRegistrations(prev => {
      const updated = { ...prev }
      delete updated[sessionId]
      return updated
    })
    setConfirmDeleteId(null)
  }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      setUserRole(user.type || 'student')
    }
    try {
      const profileData = localStorage.getItem('studentProfileData')
      if (profileData) {
        const parsed = JSON.parse(profileData)
        setStudentClassYear(parsed.classYear || '')
      }
    } catch { /* ignore */ }

  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Sessions</h1>
          {userRole === 'staff' && (
            <Button
              onClick={() => {
                setEditingSession(null)
                setSessionFormData({
                  title: '',
                  date: '',
                  time: '',
                  type: 'Virtual',
                  instructor: '',
                  requiredGrades: [],
                })
                setSessionModalOpen(true)
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          )}
        </div>
        <p className="text-xl text-muted-foreground mb-12">
          {userRole === 'student' ? 'Upcoming learning sessions and workshops' : 'Manage sessions and track attendance'}
        </p>

        {/* STUDENT VIEW */}
        {userRole === 'student' && (() => {
          const isMandatoryForMe = (s: Session) =>
            !!s.requiredGrades?.length && !!studentClassYear && s.requiredGrades.includes(studentClassYear)

          const mandatorySessions = sessions.filter(isMandatoryForMe)
          const otherSessions = sessions.filter(s => !isMandatoryForMe(s))

          const SessionCard = ({ session, index, mandatory }: { session: Session; index: number; mandatory: boolean }) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`hover:shadow-lg transition-shadow ${mandatory ? 'border-l-4 border-l-red-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{session.title}</CardTitle>
                        {mandatory && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            <ShieldAlert className="h-3 w-3" />
                            Mandatory for you
                          </span>
                        )}
                      </div>
                      <CardDescription>Instructor: {session.instructor}</CardDescription>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary shrink-0">
                      {session.type}
                    </span>
                  </div>

                  {/* Required grade tags */}
                  {!!session.requiredGrades?.length && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Required for:
                      </span>
                      {session.requiredGrades.map(g => (
                        <span key={g}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            g === studentClassYear
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-6 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{session.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{session.time}</span>
                    </div>
                    {session.type === 'Virtual' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="h-4 w-4" />
                        <span>Online Session</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{getRegistrationCount(session.id)}</span>
                      <span className="text-muted-foreground">registered</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={isRegistered(session.id) ? 'outline' : 'default'}
                      onClick={() => handleRegisterForSession(session.id)}
                      className="flex items-center gap-2"
                    >
                      {isRegistered(session.id) ? (
                        <><UserCheck className="h-4 w-4" />Registered</>
                      ) : (
                        <><UserPlus className="h-4 w-4" />Register</>
                      )}
                    </Button>
                    {/* Add to Calendar Dropdown */}
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCalendarDropdownOpen(calendarDropdownOpen === session.id ? null : session.id)}
                        className="flex items-center gap-2"
                      >
                        <CalendarPlus className="h-4 w-4" />
                        Add to Calendar
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      {calendarDropdownOpen === session.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setCalendarDropdownOpen(null)} />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={() => { addToCalendar({ title: session.title, description: `Join us for ${session.title}`, location: session.type === 'Virtual' ? 'Online (Link will be provided)' : 'Campus', startDate: session.date, startTime: session.time.split(' - ')[0], endTime: session.time.split(' - ')[1], instructor: session.instructor }, 'google'); setCalendarDropdownOpen(null) }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                            >
                              <Calendar className="h-4 w-4" />Google Calendar
                            </button>
                            <button
                              onClick={() => { addToCalendar({ title: session.title, description: `Join us for ${session.title}`, location: session.type === 'Virtual' ? 'Online (Link will be provided)' : 'Campus', startDate: session.date, startTime: session.time.split(' - ')[0], endTime: session.time.split(' - ')[1], instructor: session.instructor }, 'ics'); setCalendarDropdownOpen(null) }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                            >
                              <CalendarPlus className="h-4 w-4" />Download ICS
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )

          return (
            <div className="mb-12 space-y-10">
              {/* Mandatory for you */}
              {mandatorySessions.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <h2 className="text-2xl font-bold">Required for You</h2>
                    {studentClassYear && (
                      <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                        {studentClassYear}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">
                    These sessions are mandatory for your grade level. Make sure to register and attend.
                  </p>
                  <div className="space-y-5">
                    {mandatorySessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} mandatory />)}
                  </div>
                </section>
              )}

              {/* No class year set */}
              {!studentClassYear && sessions.some(s => s.requiredGrades?.length) && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Set your class year in <strong>My Profile</strong> to see which sessions are mandatory for you.</span>
                </div>
              )}

              {/* All other sessions */}
              <section>
                <h2 className="text-2xl font-bold mb-5">
                  {mandatorySessions.length > 0 ? 'All Other Sessions' : 'All Sessions'}
                </h2>
                {otherSessions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No additional sessions scheduled.</p>
                ) : (
                  <div className="space-y-5">
                    {otherSessions.map((s, i) => <SessionCard key={s.id} session={s} index={i} mandatory={false} />)}
                  </div>
                )}
              </section>
            </div>
          )
        })()}

        {/* STAFF VIEW - Manage RSVPs Table */}
        {userRole === 'staff' && (
          <>
            {/* Stat Boxes */}
            <div className="flex justify-end mb-4">
              <SemesterSelector />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                { title: "Today's Sessions", value: stats.activeSessions.toString(), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
                { title: 'Active Students', value: stats.totalStudents.toString(), icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
                { title: 'Average Attendance', value: `${stats.avgAttendance}%`, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100' },
                { title: 'Engagement Score', value: `${(stats.avgEngagement / 10).toFixed(1)}/10`, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' },
              ].map((stat, i) => (
                <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <div className={`p-2 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Manage RSVPs Table */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Manage Sessions</h2>
              <div className="space-y-6">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl mb-2">{session.title}</CardTitle>
                            <CardDescription>Instructor: {session.instructor}</CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                              {session.type}
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                              {getRegistrationCount(session.id)} registered
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-6 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{session.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{session.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{session.enrolled} enrolled</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedSessionForView(session)
                              setRegisteredStudentsModalOpen(true)
                            }}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                          >
                            <Users className="h-4 w-4" />
                            View Registrations ({getRegistrationCount(session.id)})
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSession(session)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          {confirmDeleteId === session.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-red-600 font-medium">Delete?</span>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteSession(session.id)} className="text-red-600 hover:bg-red-50 border-red-300">Yes</Button>
                              <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>No</Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDeleteId(session.id)}
                              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Recent Activities</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {getRecentActivities(sessions).map((activity, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1">
                          <p className="font-medium">{activity.event}</p>
                          <p className="text-sm text-muted-foreground">{activity.detail}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

      </motion.div>

      {/* Add/Edit Session Modal */}
      {sessionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => {
                setSessionModalOpen(false)
                setEditingSession(null)
                setSessionFormData({
                  title: '',
                  date: '',
                  time: '',
                  type: 'Virtual',
                  instructor: '',
                  requiredGrades: [],
                })
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-2xl font-bold mb-6">
              {editingSession ? 'Edit Session' : 'Add New Session'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={sessionFormData.title}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Computer Science Workshop"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={sessionFormData.date}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input
                    type="text"
                    required
                    value={sessionFormData.time}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2:00 PM - 4:00 PM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Type *</label>
                <select
                  required
                  value={sessionFormData.type}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, type: e.target.value as 'Virtual' | 'In-Person' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Virtual">Virtual</option>
                  <option value="In-Person">In-Person</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructor *</label>
                <input
                  type="text"
                  required
                  value={sessionFormData.instructor}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, instructor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., HighView Staff"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Required Attendees by Grade Level</label>
                <p className="text-xs text-gray-500 mb-3">Leave blank to allow all grade levels</p>
                <div className="flex flex-wrap gap-3">
                  {['Freshman', 'Sophomore', 'Junior', 'Senior'].map((grade) => (
                    <label key={grade} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sessionFormData.requiredGrades.includes(grade)}
                        onChange={(e) => {
                          setSessionFormData(prev => ({
                            ...prev,
                            requiredGrades: e.target.checked
                              ? [...prev.requiredGrades, grade]
                              : prev.requiredGrades.filter(g => g !== grade)
                          }))
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{grade}</span>
                    </label>
                  ))}
                </div>
                {sessionFormData.requiredGrades.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sessionFormData.requiredGrades.map(g => (
                      <span key={g} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{g}</span>
                    ))}
                  </div>
                )}
              </div>

              {sessionFormError && (
                <p className="text-sm text-red-600 mt-2">{sessionFormError}</p>
              )}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddSession}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {editingSession ? 'Update Session' : 'Create Session'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSessionModalOpen(false)
                    setEditingSession(null)
                    setSessionFormData({
                      title: '',
                      date: '',
                      time: '',
                      type: 'Virtual',
                      instructor: '',
                      requiredGrades: [],
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Registered Students Modal */}
      {registeredStudentsModalOpen && selectedSessionForView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedSessionForView.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getRegistrationCount(selectedSessionForView.id)} students registered
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRegisteredStudentsModalOpen(false)
                    setSelectedSessionForView(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {getRegistrationCount(selectedSessionForView.id) === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No students registered yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getRegisteredStudents(selectedSessionForView.id).map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{student.major}</p>
                        <p className="text-xs text-muted-foreground">{student.university}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-muted/30">
              <Button
                onClick={() => {
                  setRegisteredStudentsModalOpen(false)
                  setSelectedSessionForView(null)
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
