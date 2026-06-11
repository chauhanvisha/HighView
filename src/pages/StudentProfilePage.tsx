import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Brain, BookOpen, Calendar, Mail, GraduationCap, Clock, Pencil, X, Check, MapPin, Phone, Link as LinkIcon, Github, Tag } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { cohortStudents } from '../data/transformStudents'

interface StudentRecord {
  record_id: string
  attendance: number
  class_name: string
  department: string
  engagement: number
  grade: number
  photo_url: string
  session_date: string
  speaking_time: number
  student_email: string
  student_id: string
  student_name: string
  teacher_name: string
  topic: string
}

// async function loadCSVData(): Promise<StudentRecord[]> {
//   try {
//     const response = await fetch('/student.csv')
//     const text = await response.text()
//     const lines = text.split('\n')
//     const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
//     const data: StudentRecord[] = []
//     for (let i = 1; i < lines.length; i++) {
//       if (!lines[i].trim()) continue
//       const values = parseCSVLine(lines[i])
//       const record: any = {}
//       headers.forEach((header, index) => {
//         const value = values[index]
//         if (['attendance', 'engagement', 'grade', 'speaking_time'].includes(header)) {
//           record[header] = parseFloat(value)
//         } else {
//           record[header] = value
//         }
//       })
//       data.push(record)
//     }
//     return data
//   } catch {
//     return []
//   }
// }


// const mockStudents: StudentRecord[] = [
//   { student_id: '10001', student_name: 'Student 10001', student_email: 'student10001@university.edu', class_name: 'Quantum Mechanics', attendance: 90.8, engagement: 65.6, grade: 71, teacher_name: 'Dr. Brown', session_date: '2025-09-26', photo_url: '', department: 'Mathematics', topic: 'Algorithm Design', speaking_time: 119, record_id: 'record_test001#10001' },
//   { student_id: '10011', student_name: 'Student 10011', student_email: 'student10011@university.edu', class_name: 'Organic Chemistry', attendance: 80.9, engagement: 78.1, grade: 76, teacher_name: 'Prof. Davis', session_date: '2025-10-25', photo_url: '', department: 'Biology', topic: 'Algorithm Design', speaking_time: 64, record_id: 'record_test001#10011' },
//   { student_id: '10018', student_name: 'Student 10018', student_email: 'student10018@university.edu', class_name: 'Statistics 101', attendance: 97.1, engagement: 78.7, grade: 95, teacher_name: 'Dr. Johnson', session_date: '2025-10-26', photo_url: '', department: 'Biology', topic: 'Chemical Bonding', speaking_time: 68, record_id: 'record_test018#10018' },
//   { student_id: '10007', student_name: 'Student 10007', student_email: 'student10007@university.edu', class_name: 'Statistics 101', attendance: 64.5, engagement: 74.3, grade: 86, teacher_name: 'Dr. Brown', session_date: '2025-10-11', photo_url: '', department: 'Engineering', topic: 'Newtonian Mechanics', speaking_time: 80, record_id: 'record_test007#10007' },
//   { student_id: '10020', student_name: 'Student 10020', student_email: 'student10020@university.edu', class_name: 'General Chemistry', attendance: 62.1, engagement: 63.7, grade: 86, teacher_name: 'Prof. Davis', session_date: '2025-10-22', photo_url: '', department: 'Biology', topic: 'Wave Physics', speaking_time: 96, record_id: 'record_test020#10020' },
// ]

function getYear(studentId: string): string {
  const n = parseInt(studentId) % 4
  return ['Freshman', 'Sophomore', 'Junior', 'Senior'][n]
}

function getStatus(s: StudentRecord): 'Active' | 'At Risk' | 'Inactive' {
  const p = Math.round((s.attendance + s.engagement) / 2)
  if (p >= 80) return 'Active'
  if (p >= 65) return 'At Risk'
  return 'Inactive'
}

function getLetterGrade(grade: number): string {
  if (grade >= 90) return 'A'
  if (grade >= 80) return 'B'
  if (grade >= 70) return 'C'
  if (grade >= 60) return 'D'
  return 'F'
}

interface ProgressOverride {
  ai: number
  experiential: number
  sessionAttendance: number
}

interface StudentSelfProfile {
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

export default function StudentProfilePage() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<StudentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [isStaff, setIsStaff] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [overrides, setOverrides] = useState<ProgressOverride | null>(null)
  const [editValues, setEditValues] = useState<ProgressOverride>({ ai: 0, experiential: 0, sessionAttendance: 0 })
  const [selfProfile, setSelfProfile] = useState<StudentSelfProfile | null>(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setIsStaff(user?.role === 'staff')

    // Use real student data from students.json
    const realStudent = cohortStudents.find(s => s.id === studentId)
    if (realStudent) {
      // Load any manual overrides from localStorage
      const savedOverrides = localStorage.getItem(`progress_overrides_${studentId}`)
      const parsed: ProgressOverride | null = savedOverrides ? JSON.parse(savedOverrides) : null
      setOverrides(parsed)

      // Transform to StudentRecord format
      const studentRecord: StudentRecord = {
        student_id: realStudent.id,
        student_name: realStudent.name,
        student_email: realStudent.email,
        class_name: realStudent.major,
        attendance: parsed?.sessionAttendance ?? realStudent.sessionAttendance,
        engagement: parsed?.ai ?? realStudent.ai,
        grade: parsed?.experiential ?? realStudent.experiential,
        teacher_name: 'HighView Staff',
        session_date: '2026-09-01',
        photo_url: `https://ui-avatars.com/api/?name=${realStudent.name.replace(' ', '+')}&background=random`,
        department: realStudent.school,
        topic: '2026-27 College Cohort',
        speaking_time: realStudent.eventsAttended * 10,
        record_id: realStudent.id
      }
      setStudent(studentRecord)
      setEditValues({
        ai: parsed?.ai ?? realStudent.ai,
        experiential: parsed?.experiential ?? realStudent.experiential,
        sessionAttendance: parsed?.sessionAttendance ?? realStudent.sessionAttendance,
      })

      // Load student's self-created profile data (keyed by email)
      const selfRaw = localStorage.getItem(`studentProfileData_${realStudent.email}`)
      setSelfProfile(selfRaw ? JSON.parse(selfRaw) : null)
    } else {
      setStudent(null)
    }
    setLoading(false)
  }, [studentId])

  function saveProgressOverrides() {
    if (!student) return
    const clamped: ProgressOverride = {
      ai: Math.min(100, Math.max(0, editValues.ai)),
      experiential: Math.min(100, Math.max(0, editValues.experiential)),
      sessionAttendance: Math.min(100, Math.max(0, editValues.sessionAttendance)),
    }
    localStorage.setItem(`progress_overrides_${studentId}`, JSON.stringify(clamped))
    setOverrides(clamped)
    setStudent(prev => prev ? { ...prev, engagement: clamped.ai, grade: clamped.experiential, attendance: clamped.sessionAttendance } : prev)
    setEditOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <Button variant="ghost" onClick={() => navigate('/cohort')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cohort
          </Button>
          <Card className="p-12 text-center">
            <p className="text-xl font-semibold mb-2">Student not found</p>
            <p className="text-muted-foreground">No profile found for ID: {studentId}</p>
          </Card>
        </div>
      </div>
    )
  }

  const status = getStatus(student)
  const year = getYear(student.student_id)
  const progress = Math.round((student.attendance + student.engagement) / 2)
  const letterGrade = getLetterGrade(student.grade)

  // Pillar scores (individual)
  const aiScore = student.engagement.toFixed(1)
  const experientialScore = student.grade.toFixed(1)
  const sessionAttendance = student.attendance.toFixed(1)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate('/cohort')} className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cohort
          </Button>

          {/* Profile Header */}
          <Card className="p-8 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                {student.student_name?.charAt(0) || '?'}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{student.student_name}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                    status === 'Active' ? 'bg-green-100 text-green-700' :
                    status === 'At Risk' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{status}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{student.student_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{student.student_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{student.department || student.class_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{year}</span>
                  </div>
                </div>
              </div>

              {/* Overall Progress */}
              <div className="text-center md:text-right">
                <div className="text-4xl font-bold text-primary">{progress}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </div>
            </div>
          </Card>

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-1">{student.attendance.toFixed(1)}%</div>
              <div className="font-medium mb-1">Attendance</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-3">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${student.attendance}%` }} />
              </div>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-4xl font-bold text-green-600 mb-1">{student.engagement.toFixed(1)}%</div>
              <div className="font-medium mb-1">Engagement</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-3">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${student.engagement}%` }} />
              </div>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-4xl font-bold text-purple-600 mb-1">{letterGrade}</div>
              <div className="font-medium mb-1">Grade ({student.grade}%)</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-3">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${student.grade}%` }} />
              </div>
            </Card>
          </div>

          {/* Pillar Progress */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Pillar Progress</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Scores are out of 100. {overrides ? 'Values have been manually updated.' : 'Values reflect latest data.'}</p>
              </div>
              {isStaff && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(v => !v)} className="gap-2">
                  {editOpen ? <><X className="h-4 w-4" /> Cancel</> : <><Pencil className="h-4 w-4" /> Edit Progress</>}
                </Button>
              )}
            </div>

            {/* Manual edit form (staff only) */}
            {editOpen && (
              <div className="mb-6 p-4 bg-muted/40 border rounded-xl">
                <p className="text-sm font-medium mb-4">Manually update pillar scores (0–100)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">AI Learning</label>
                    <input
                      type="number" min={0} max={100}
                      value={editValues.ai}
                      onChange={e => setEditValues(v => ({ ...v, ai: Number(e.target.value) }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Experiential Learning</label>
                    <input
                      type="number" min={0} max={100}
                      value={editValues.experiential}
                      onChange={e => setEditValues(v => ({ ...v, experiential: Number(e.target.value) }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Session Attendance</label>
                    <input
                      type="number" min={0} max={100}
                      value={editValues.sessionAttendance}
                      onChange={e => setEditValues(v => ({ ...v, sessionAttendance: Number(e.target.value) }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                </div>
                <Button onClick={saveProgressOverrides} size="sm" className="mt-4 gap-2">
                  <Check className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 border rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-semibold">AI Learning</span>
                </div>
                <div className="text-3xl font-bold mb-1">{aiScore}%</div>
                <p className="text-xs text-muted-foreground mb-1">Participation in AI-assisted learning tools and digital engagement sessions</p>
                <div className="w-full bg-secondary rounded-full h-2 mt-3">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${aiScore}%` }} />
                </div>
              </div>

              <div className="p-5 border rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-semibold">Experiential Learning</span>
                </div>
                <div className="text-3xl font-bold mb-1">{experientialScore}%</div>
                <p className="text-xs text-muted-foreground mb-1">Events attended, job shadows, mentorship sessions, and internship applications submitted</p>
                <div className="w-full bg-secondary rounded-full h-2 mt-3">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${experientialScore}%` }} />
                </div>
              </div>

              <div className="p-5 border rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="font-semibold">Session Attendance</span>
                </div>
                <div className="text-3xl font-bold mb-1">{sessionAttendance}%</div>
                <p className="text-xs text-muted-foreground mb-1">Percentage of scheduled cohort sessions attended (sessions attended ÷ total sessions)</p>
                <div className="w-full bg-secondary rounded-full h-2 mt-3">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${sessionAttendance}%` }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Student Self-Created Profile */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold">Student Profile</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Information filled out by the student on their own profile page</p>
              </div>
            </div>

            {selfProfile ? (
              <div className="space-y-5">
                {/* Bio */}
                {selfProfile.bio && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">About</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selfProfile.bio}</p>
                  </div>
                )}

                {/* Education */}
                {(selfProfile.school || selfProfile.major || selfProfile.classYear || selfProfile.gpa) && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Education</p>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        {selfProfile.school && <p className="font-semibold text-sm">{selfProfile.school}</p>}
                        {selfProfile.major && <p className="text-sm text-muted-foreground">{selfProfile.major}</p>}
                        <div className="flex flex-wrap gap-3 mt-1">
                          {selfProfile.classYear && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />{selfProfile.classYear}
                            </span>
                          )}
                          {selfProfile.gpa && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" />GPA: {selfProfile.gpa}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selfProfile.skills && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" /> Skills &amp; Interests
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selfProfile.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                        <span key={skill} className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact */}
                {(selfProfile.location || selfProfile.phone || selfProfile.linkedin || selfProfile.github) && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contact</p>
                    <div className="space-y-1.5">
                      {selfProfile.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />{selfProfile.location}
                        </div>
                      )}
                      {selfProfile.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />{selfProfile.phone}
                        </div>
                      )}
                      {selfProfile.linkedin && (
                        <div className="flex items-center gap-2 text-sm">
                          <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <a href={selfProfile.linkedin.startsWith('http') ? selfProfile.linkedin : `https://${selfProfile.linkedin}`}
                            target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                            {selfProfile.linkedin}
                          </a>
                        </div>
                      )}
                      {selfProfile.github && (
                        <div className="flex items-center gap-2 text-sm">
                          <Github className="h-4 w-4 text-muted-foreground shrink-0" />
                          <a href={selfProfile.github.startsWith('http') ? selfProfile.github : `https://github.com/${selfProfile.github}`}
                            target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                            {selfProfile.github}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">This student has not filled out their profile yet.</p>
            )}
          </Card>

          {/* Session Details */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Session Details</h2>
              <p className="text-sm text-muted-foreground mt-1">Most recent session information</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Course</p>
                  <p className="font-semibold">{student.class_name}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Topic</p>
                  <p className="font-semibold">{student.topic}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Teacher</p>
                  <p className="font-semibold">{student.teacher_name}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Speaking Time</p>
                  </div>
                  <p className="font-semibold">{student.speaking_time} min</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-muted/30 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Active</p>
                  <p className="font-semibold">{student.session_date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Department</p>
                  <p className="font-semibold">{student.department}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Year</p>
                  <p className="font-semibold">{year}</p>
                </div>
              </div>
            </div>
          </Card>

        </motion.div>
      </div>
    </div>
  )
}
