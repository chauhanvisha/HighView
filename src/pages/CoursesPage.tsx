import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Users, Download, BarChart3, PieChart, Activity, Award, Calendar, TrendingUp, X, CheckCircle, XCircle, GraduationCap, Sparkles, CheckSquare2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { SemesterSelector } from '../components/SemesterSelector'
import { useSemester } from '../contexts/SemesterContext'
import { getStatsBySemester } from '../data/semesterData'
import { realStudents } from '../data/transformStudents'
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ── Student course catalog ─────────────────────────────────────────────────
interface CourseItem {
  id: string
  name: string
  description: string
  instructor: string
  duration: string
  credits: number
  category: string
  upcoming: boolean
}

const COURSE_CATALOG: CourseItem[] = [
  {
    id: 'ds101',
    name: 'Introduction to Data Science',
    description: 'Core concepts of data collection, cleaning, analysis, and visualization using Python and Jupyter.',
    instructor: 'Dr. Sarah Mitchell',
    duration: '12 weeks',
    credits: 3,
    category: 'Data Science',
    upcoming: false,
  },
  {
    id: 'web101',
    name: 'Web Development Fundamentals',
    description: 'Build modern websites using HTML, CSS, JavaScript, and React. Includes real project deployment.',
    instructor: 'Prof. James Okafor',
    duration: '10 weeks',
    credits: 3,
    category: 'Software Engineering',
    upcoming: false,
  },
  {
    id: 'ml101',
    name: 'Machine Learning Basics',
    description: 'Supervised and unsupervised learning, model evaluation, and scikit-learn hands-on labs.',
    instructor: 'Dr. Priya Nair',
    duration: '12 weeks',
    credits: 4,
    category: 'AI & ML',
    upcoming: false,
  },
  {
    id: 'py201',
    name: 'Advanced Python Programming',
    description: 'Decorators, async programming, design patterns, and performance optimization in Python.',
    instructor: 'Prof. Carlos Reyes',
    duration: '8 weeks',
    credits: 3,
    category: 'Software Engineering',
    upcoming: true,
  },
  {
    id: 'db101',
    name: 'Database Design & SQL',
    description: 'Relational modeling, normalization, advanced SQL queries, and intro to NoSQL databases.',
    instructor: 'Dr. Aisha Williams',
    duration: '10 weeks',
    credits: 3,
    category: 'Data Engineering',
    upcoming: true,
  },
  {
    id: 'ai301',
    name: 'Applied AI in the Workplace',
    description: 'Practical applications of AI tools, prompt engineering, and automation for career readiness.',
    instructor: 'Dr. Leo Tanaka',
    duration: '6 weeks',
    credits: 2,
    category: 'AI & ML',
    upcoming: true,
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Data Science': 'bg-blue-100 text-blue-700',
  'Software Engineering': 'bg-purple-100 text-purple-700',
  'AI & ML': 'bg-violet-100 text-violet-700',
  'Data Engineering': 'bg-emerald-100 text-emerald-700',
}

const LS_REGISTRATIONS = 'studentCourseRegistrations'

function getRegistrations(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_REGISTRATIONS) || '[]')
  } catch {
    return []
  }
}

function saveRegistrations(ids: string[]) {
  localStorage.setItem(LS_REGISTRATIONS, JSON.stringify(ids))
}

// ── Student Courses View ───────────────────────────────────────────────────
function StudentCoursesView() {
  const [registrations, setRegistrations] = useState<string[]>(getRegistrations)
  const [tab, setTab] = useState<'all' | 'upcoming'>('all')

  const myCourses = COURSE_CATALOG.filter(c => registrations.includes(c.id))
  const tableCourses = tab === 'all' ? COURSE_CATALOG : COURSE_CATALOG.filter(c => c.upcoming)

  const toggle = (id: string) => {
    setRegistrations(prev => {
      const next = prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
      saveRegistrations(next)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Courses</h1>
          <p className="text-muted-foreground">Track your enrolled courses and discover new ones</p>
        </motion.div>

        {/* ── My Courses ─────────────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            My Courses
          </h2>

          {myCourses.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">You haven't registered for any courses yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Browse the course table below and click <strong>Register</strong> to enroll.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[course.category] ?? 'bg-gray-100 text-gray-700'}`}>
                          {course.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckSquare2 className="h-3 w-3" />
                          Enrolled
                        </span>
                      </div>
                      <CardTitle className="text-base mt-2">{course.name}</CardTitle>
                      <CardDescription className="text-xs">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course.instructor}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration}</span>
                        <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />{course.credits} credits</span>
                      </div>
                      {course.upcoming && (
                        <span className="inline-block text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-0.5 mb-2">
                          Starts soon
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                        onClick={() => toggle(course.id)}
                      >
                        Drop Course
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── All Courses / Upcoming Toggle Table ────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Course Catalog
            </h2>
            {/* Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
              <button
                onClick={() => setTab('all')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tab === 'all' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Courses
              </button>
              <button
                onClick={() => setTab('upcoming')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tab === 'upcoming' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Upcoming Courses
              </button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left py-3 px-4 text-sm font-semibold">Course</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold hidden md:table-cell">Instructor</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold hidden sm:table-cell">Duration</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold hidden lg:table-cell">Credits</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableCourses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                          No upcoming courses found.
                        </td>
                      </tr>
                    ) : (
                      tableCourses.map((course, i) => {
                        const isRegistered = registrations.includes(course.id)
                        return (
                          <motion.tr
                            key={course.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-sm">{course.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{course.description.slice(0, 60)}…</div>
                              <span className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[course.category] ?? 'bg-gray-100 text-gray-600'}`}>
                                {course.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-sm text-muted-foreground hidden md:table-cell">{course.instructor}</td>
                            <td className="py-3.5 px-4 text-sm text-center hidden sm:table-cell">
                              <span className="flex items-center justify-center gap-1 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />{course.duration}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-sm text-center font-medium hidden lg:table-cell">{course.credits} cr</td>
                            <td className="py-3.5 px-4 text-center">
                              {course.upcoming ? (
                                <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5">
                                  Upcoming
                                </span>
                              ) : (
                                <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <Button
                                size="sm"
                                variant={isRegistered ? 'outline' : 'default'}
                                className={isRegistered
                                  ? 'text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200'
                                  : ''}
                                onClick={() => toggle(course.id)}
                              >
                                {isRegistered ? 'Drop' : 'Register'}
                              </Button>
                            </td>
                          </motion.tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  )
}

const courseStudents = {
  'Introduction to Data Science': {
    enrolled: realStudents.slice(0, 9).map(s => ({
      id: s.id,
      name: s.name,
      status: s.attendanceRate > 75 ? 'completed' : 'in-progress'
    })),
  },
  'Web Development Fundamentals': {
    enrolled: realStudents.slice(9, 19).map(s => ({
      id: s.id,
      name: s.name,
      status: s.attendanceRate > 75 ? 'completed' : 'in-progress'
    })),
  },
  'Machine Learning Basics': {
    enrolled: realStudents.slice(19, 27).map(s => ({
      id: s.id,
      name: s.name,
      status: s.attendanceRate > 75 ? 'completed' : 'in-progress'
    })),
  },
  'Advanced Python Programming': {
    enrolled: realStudents.slice(27, 35).map(s => ({
      id: s.id,
      name: s.name,
      status: s.attendanceRate > 75 ? 'completed' : 'in-progress'
    })),
  },
  'Database Design & SQL': {
    enrolled: realStudents.slice(35, 44).map(s => ({
      id: s.id,
      name: s.name,
      status: s.attendanceRate > 75 ? 'completed' : 'in-progress'
    })),
  },
}

export default function CoursesPage() {
  const [userRole, setUserRole] = useState<'staff' | 'student'>('student')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setUserRole(parsed.type || 'student')
      } catch { /* ignore */ }
    }
  }, [])

  if (userRole === 'student') {
    return <StudentCoursesView />
  }

  return <StaffCoursesView />
}

function StaffCoursesView() {
  const { selectedSemester } = useSemester()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState<{
    courseName: string
    type: 'enrolled' | 'completed'
    students: Array<{ id: string; name: string; status: string }>
  } | null>(null)

  const stats = useMemo(() => getStatsBySemester(selectedSemester.id), [selectedSemester.id])

  const courses = useMemo(() => {
    const cohorts = [...new Set(realStudents.map(s => s.cohort))]
    const courseDescriptions: Record<string, { description: string; audience: string; duration: string }> = {
      'Fall 2024': {
        description: 'An introductory AI course designed for college freshmen. Covers core concepts, tools, and real-world applications of artificial intelligence.',
        audience: 'Freshmen',
        duration: '12 weeks',
      },
      'Spring 2025': {
        description: 'A sophomore-level course building on AI fundamentals. Explores intermediate AI concepts, data analysis, and hands-on projects.',
        audience: 'Sophomores',
        duration: '12 weeks',
      },
      'Summer 2025': {
        description: 'A practical course for upperclassmen on leveraging AI tools for career development, job searching, networking, and professional growth.',
        audience: 'Sophomores, Juniors & Seniors',
        duration: '8 weeks',
      },
    }
    return cohorts.map(cohort => {
      const studentsInCohort = realStudents.filter(s => s.cohort === cohort)
      const courseInfo = courseDescriptions[cohort] || {
        description: `Advanced course for ${cohort} cohort students.`,
        audience: 'All levels',
        duration: '12 weeks',
      }
      return {
        title: cohort,
        description: courseInfo.description,
        audience: courseInfo.audience,
        students: studentsInCohort.length,
        duration: courseInfo.duration,
      }
    })
  }, [])

  const attendanceDistribution = useMemo(() => {
    const excellent = realStudents.filter(s => s.attendanceRate >= 90).length
    const good = realStudents.filter(s => s.attendanceRate >= 75 && s.attendanceRate < 90).length
    const fair = realStudents.filter(s => s.attendanceRate >= 50 && s.attendanceRate < 75).length
    const atRisk = realStudents.filter(s => s.attendanceRate < 50).length
    return [
      { name: 'Excellent (90-100%)', value: excellent, color: '#22c55e' },
      { name: 'Good (75-89%)', value: good, color: '#3b82f6' },
      { name: 'Fair (50-74%)', value: fair, color: '#f59e0b' },
      { name: 'At Risk (<50%)', value: atRisk, color: '#ef4444' },
    ].filter(d => d.value > 0)
  }, [])

  const insightCounts = useMemo(() => {
    const highEngagement = realStudents.filter(s => s.attendanceRate >= 90).length
    const atRisk = realStudents.filter(s => s.attendanceRate < 50).length
    const notStarted = realStudents.filter(s => s.attendanceRate === 0).length
    return { highEngagement, atRisk, notStarted }
  }, [])

  const keyMetrics = useMemo(() => [
    { label: 'Total Students', value: stats.totalStudents.toString(), icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: 'Avg Engagement', value: `${stats.avgEngagement}%`, icon: Activity, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: 'Active Sessions', value: stats.activeSessions.toString(), icon: Calendar, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { label: 'Top Performers', value: stats.topPerformers.toString(), icon: Award, color: 'text-orange-600', bgColor: 'bg-orange-100' }
  ], [stats])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Courses</h1>
              <p className="text-muted-foreground">Course offerings and engagement analytics</p>
            </div>
            <div className="flex gap-3 items-center">
              <SemesterSelector />
              <Button onClick={() => {
                const rows = [
                  ['Course', 'Audience', 'Students', 'Completion Rate', 'Duration'],
                  ...courses.map((c: any) => [c.title, c.audience, c.students, `${c.completionRate ?? '—'}%`, c.duration ?? '—'])
                ]
                const csv = rows.map(r => r.map((v: any) => `"${v}"`).join(',')).join('\n')
                const a = document.createElement('a')
                a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
                a.download = `courses_${selectedSemester.name.replace(/\s+/g, '_')}.csv`
                a.click()
              }}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Viewing data for: <span className="font-semibold text-foreground">{selectedSemester.name}</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {keyMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metric.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Course Cards */}
        <h2 className="text-xl font-semibold mb-4">Course Catalog</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {courses.map((course, index) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <BookOpen className="h-10 w-10 text-primary mb-3" />
                  <div className="mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                      {course.audience}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.students} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Course Completion */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Course Completion
            </CardTitle>
            <CardDescription>Enrollment and completion rates by course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Course</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Enrolled</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Completed</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Introduction to Data Science', enrolled: 45, completed: 38 },
                    { name: 'Web Development Fundamentals', enrolled: 52, completed: 47 },
                    { name: 'Machine Learning Basics', enrolled: 38, completed: 31 },
                    { name: 'Advanced Python Programming', enrolled: 41, completed: 35 },
                    { name: 'Database Design & SQL', enrolled: 48, completed: 42 },
                  ].map((course, index) => {
                    const completionRate = Math.round((course.completed / course.enrolled) * 100)
                    const students = courseStudents[course.name as keyof typeof courseStudents]?.enrolled || []
                    const completedStudents = students.filter(s => s.status === 'completed')
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm text-gray-900">{course.name}</td>
                        <td className="text-center py-3 px-2">
                          <button
                            onClick={() => { setModalData({ courseName: course.name, type: 'enrolled', students }); setModalOpen(true) }}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {course.enrolled}
                          </button>
                        </td>
                        <td className="text-center py-3 px-2">
                          <button
                            onClick={() => { setModalData({ courseName: course.name, type: 'completed', students: completedStudents }); setModalOpen(true) }}
                            className="text-sm font-semibold text-green-600 hover:text-green-800 hover:underline cursor-pointer"
                          >
                            {course.completed}
                          </button>
                        </td>
                        <td className="text-center py-3 px-2">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completionRate}%` }} />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Distribution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Attendance Distribution
            </CardTitle>
            <CardDescription>Student attendance rate breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>Calculated from current student data ({realStudents.length} students)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-900">Cohort Size</div>
                  <p className="text-sm text-blue-700">{realStudents.length} students enrolled in the current cohort. {insightCounts.highEngagement > 0 ? `${insightCounts.highEngagement} student${insightCounts.highEngagement !== 1 ? 's' : ''} with attendance ≥ 90%.` : 'Sessions have not started yet — attendance data will populate once classes begin.'}</p>
                </div>
              </div>
              {insightCounts.atRisk > 0 && (
                <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-orange-900">At-Risk Students</div>
                    <p className="text-sm text-orange-700">{insightCounts.atRisk} student{insightCounts.atRisk !== 1 ? 's' : ''} with attendance below 50% — follow-up recommended.</p>
                  </div>
                </div>
              )}
              {insightCounts.notStarted > 0 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-yellow-900">Not Started</div>
                    <p className="text-sm text-yellow-700">{insightCounts.notStarted} student{insightCounts.notStarted !== 1 ? 's' : ''} have not attended any sessions yet.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List Modal */}
      {modalOpen && modalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full p-6 relative shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold mb-2">
              {modalData.type === 'enrolled' ? 'Enrolled Students' : 'Completed Students'}
            </h2>
            <p className="text-sm text-gray-600 mb-6">{modalData.courseName}</p>
            {modalData.students.length > 0 ? (
              <div className="space-y-2">
                {modalData.students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.status === 'completed' ? (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Completed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          <Activity className="h-4 w-4" />
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <XCircle className="h-12 w-12 mb-3" />
                <p>No students found</p>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setModalOpen(false)}>Close</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
