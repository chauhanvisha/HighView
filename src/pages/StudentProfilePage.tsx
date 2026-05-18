import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Brain, BookOpen, Calendar, Mail, GraduationCap, Clock } from 'lucide-react'
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

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') { inQuotes = !inQuotes }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += char }
  }
  result.push(current.trim())
  return result
}

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

export default function StudentProfilePage() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<StudentRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Use real student data from students.json
    const realStudent = cohortStudents.find(s => s.id === studentId)
    if (realStudent) {
      // Transform to StudentRecord format
      const studentRecord: StudentRecord = {
        student_id: realStudent.id,
        student_name: realStudent.name,
        student_email: realStudent.email,
        class_name: realStudent.major,
        attendance: realStudent.sessionAttendance,
        engagement: realStudent.ai,
        grade: realStudent.experiential,
        teacher_name: 'HighView Staff',
        session_date: '2026-09-01',
        photo_url: `https://ui-avatars.com/api/?name=${realStudent.name.replace(' ', '+')}&background=random`,
        department: realStudent.school,
        topic: '2026-27 College Cohort',
        speaking_time: realStudent.eventsAttended * 10,
        record_id: realStudent.id
      }
      setStudent(studentRecord)
    } else {
      setStudent(null)
    }
    setLoading(false)
  }, [studentId])

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
            <h2 className="text-xl font-semibold mb-6">Pillar Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 border rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-semibold">AI</span>
                </div>
                <div className="text-3xl font-bold mb-1">{aiScore}%</div>
                <p className="text-xs text-muted-foreground mb-3">Engagement score</p>
                <div className="w-full bg-secondary rounded-full h-2">
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
                <p className="text-xs text-muted-foreground mb-3">Grade performance</p>
                <div className="w-full bg-secondary rounded-full h-2">
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
                <p className="text-xs text-muted-foreground mb-3">Attendance rate</p>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${sessionAttendance}%` }} />
                </div>
              </div>
            </div>
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
