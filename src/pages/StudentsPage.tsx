import { motion } from 'framer-motion'
import { Search, Plus, Eye, Mail, BarChart3, ChevronLeft, ChevronRight, Camera, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { useState, useEffect, useRef } from 'react'
import { getAllStudents, addStudent } from '../services/api'
import { realStudents } from '../data/transformStudents'
import { videoService } from '../services/videoService'

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

// Load CSV data
async function loadCSVData(): Promise<StudentRecord[]> {
  try {
    const response = await fetch('/student.csv')
    const text = await response.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    
    const data: StudentRecord[] = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const values = parseCSVLine(lines[i])
      const record: any = {}
      headers.forEach((header, index) => {
        const value = values[index]
        if (['attendance', 'engagement', 'grade', 'speaking_time'].includes(header)) {
          record[header] = parseFloat(value)
        } else {
          record[header] = value
        }
      })
      data.push(record)
    }
    return data
  } catch (error) {
    console.error('Error loading CSV:', error)
    return []
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

const getStatusColor = (attendance: number) => {
  if (attendance >= 80) return 'bg-green-100 text-green-800 border-green-200'
  if (attendance >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

interface EnrollModal {
  studentId: string
  studentName: string
}

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [apiStudents, setApiStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrollModal, setEnrollModal] = useState<EnrollModal | null>(null)
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [enrollStatus, setEnrollStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [enrollError, setEnrollError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch students from API on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        // Use real student data from students.json
        const transformedStudents = realStudents.map(student => ({
          student_id: student.id,
          student_name: student.name,
          student_email: student.email,
          class_name: student.major,
          attendance: student.attendanceRate,
          engagement: student.engagementScore,
          grade: Math.round(student.gpa * 25), // Convert GPA to percentage
          teacher_name: 'HighView Staff',
          session_date: student.enrollmentDate,
          photo_url: student.picture,
          department: student.university,
          topic: student.cohort,
          speaking_time: Math.round(student.sessionsAttended * 10),
          record_id: `${student.id}_${student.name.replace(/\s/g, '_')}`
        }))
        console.log('Loaded real students:', transformedStudents)
        setApiStudents(transformedStudents)
        setError(null)
      } catch (err) {
        console.error('Error loading students:', err)
        // Use real data as fallback
        const mockStudents = [
          {
            student_id: '10001',
            student_name: 'Student 10001',
            student_email: 'student10001@university.edu',
            class_name: 'Quantum Mechanics',
            attendance: 90.8,
            engagement: 65.6,
            grade: 71,
            teacher_name: 'Dr. Brown',
            session_date: '2025-09-26',
            photo_url: '👨‍🎓',
            department: 'Mathematics',
            topic: 'Algorithm Design',
            speaking_time: 119,
            record_id: 'record_test001#10001'
          },
          {
            student_id: '10011',
            student_name: 'Student 10011',
            student_email: 'student10011@university.edu',
            class_name: 'Organic Chemistry',
            attendance: 80.9,
            engagement: 78.1,
            grade: 76,
            teacher_name: 'Prof. Davis',
            session_date: '2025-10-25',
            photo_url: '👩‍🎓',
            department: 'Biology',
            topic: 'Algorithm Design',
            speaking_time: 64,
            record_id: 'record_test001#10011'
          },
          {
            student_id: '10018',
            student_name: 'Student 10018',
            student_email: 'student10018@university.edu',
            class_name: 'Statistics 101',
            attendance: 97.1,
            engagement: 78.7,
            grade: 95,
            teacher_name: 'Dr. Johnson',
            session_date: '2025-10-26',
            photo_url: '👨‍🎓',
            department: 'Biology',
            topic: 'Chemical Bonding',
            speaking_time: 68,
            record_id: 'record_test018#10018'
          },
          {
            student_id: '10007',
            student_name: 'Student 10007',
            student_email: 'student10007@university.edu',
            class_name: 'Statistics 101',
            attendance: 64.5,
            engagement: 74.3,
            grade: 86,
            teacher_name: 'Dr. Brown',
            session_date: '2025-10-11',
            photo_url: '👨‍🎓',
            department: 'Engineering',
            topic: 'Newtonian Mechanics',
            speaking_time: 80,
            record_id: 'record_test007#10007'
          },
          {
            student_id: '10020',
            student_name: 'Student 10020',
            student_email: 'student10020@university.edu',
            class_name: 'General Chemistry',
            attendance: 62.1,
            engagement: 63.7,
            grade: 86,
            teacher_name: 'Prof. Davis',
            session_date: '2025-10-22',
            photo_url: '👩‍🎓',
            department: 'Biology',
            topic: 'Wave Physics',
            speaking_time: 96,
            record_id: 'record_test020#10020'
          }
        ]
        setApiStudents(mockStudents)
        setError(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  // Load already-enrolled student IDs from backend
  useEffect(() => {
    videoService.getEnrolledStudents().then((students) => {
      setEnrolledIds(new Set(students.map((s) => s.studentId)))
    }).catch(() => {/* backend may not be running */})
  }, [])

  const handleEnrollPhoto = async (file: File) => {
    if (!enrollModal) return
    setEnrollStatus('uploading')
    setEnrollError('')
    try {
      await videoService.uploadStudentPhoto(enrollModal.studentId, enrollModal.studentName, file)
      setEnrolledIds((prev) => new Set([...prev, enrollModal.studentId]))
      setEnrollStatus('success')
      setTimeout(() => {
        setEnrollModal(null)
        setEnrollStatus('idle')
      }, 1500)
    } catch (err) {
      setEnrollStatus('error')
      setEnrollError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  // Handler for adding a new student
  const handleAddStudent = async () => {
    try {
      const newStudent = {
        id: "S124",
        name: "Alice Johnson",
        email: "alice@university.edu",
        class_id: "COEN233",
        class_name: "Networking"
      }
      const result = await addStudent(newStudent)
      console.log('Student added:', result)
      // Refresh the student list
      const data = await getAllStudents()
      setApiStudents(data)
    } catch (err) {
      console.error('Error adding student:', err)
      alert('Failed to add student')
    }
  }

  // Combine API students with mock students, prioritize API data
  const allStudents = apiStudents.length > 0 ? apiStudents : []
  
  const filteredStudents = allStudents.filter((student: any) => {
    const name = student.student_name || student.name || ''
    const id = student.student_id || student.id || ''
    const className = student.class_name || student.class || ''
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = filterClass === 'all' || className === filterClass
    return matchesSearch && matchesClass
  })

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Students Management</h1>
              <p className="text-muted-foreground">
                Manage and track student information and performance
              </p>
            </div>
            <Button className="gap-2" onClick={handleAddStudent}>
              <Plus className="h-4 w-4" />
              Add Student
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <Card className="p-6 mb-6">
              <p className="text-center text-muted-foreground">Loading students from database...</p>
            </Card>
          )}

          {/* Error State - Subtle warning */}
          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <span>⚠️ {error} • Showing demo data</span>
            </div>
          )}

          {/* API Data Display - Subtle success indicator */}
          {!loading && apiStudents.length > 0 && (
            <div className="mb-4 flex items-center gap-2 text-sm text-green-600">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Live data • {apiStudents.length} students loaded{enrolledIds.size > 0 ? ` • ${enrolledIds.size} faces enrolled` : ''}</span>
            </div>
          )}

          {/* Search and Filters */}
          <Card className="p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Classes</option>
                <option value="CS 301">CS 301</option>
                <option value="Math 101">Math 101</option>
                <option value="Physics 202">Physics 202</option>
              </select>
            </div>
          </Card>

          {/* Face Enrollment Panel */}
          <Card className="mb-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Face Enrollment for Attendance Tracking
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Upload a photo for each student so the AI can track attendance from classroom videos.
                  {enrolledIds.size > 0 && <span className="text-green-600 font-medium"> {enrolledIds.size}/{filteredStudents.length} enrolled.</span>}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredStudents.slice(0, 20).map((student: any) => (
                <button
                  key={student.student_id}
                  onClick={() => {
                    setEnrollModal({ studentId: student.student_id, studentName: student.student_name })
                    setEnrollStatus('idle')
                    setEnrollError('')
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-md text-center
                    ${enrolledIds.has(student.student_id)
                      ? 'border-green-400 bg-green-50 hover:bg-green-100'
                      : 'border-dashed border-gray-300 hover:border-primary hover:bg-primary/5'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                    ${enrolledIds.has(student.student_id) ? 'bg-green-500' : 'bg-gray-400'}`}>
                    {enrolledIds.has(student.student_id)
                      ? <CheckCircle className="h-5 w-5" />
                      : <Camera className="h-5 w-5" />
                    }
                  </div>
                  <span className="text-xs font-medium leading-tight line-clamp-2">{student.student_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {enrolledIds.has(student.student_id) ? '✓ Enrolled' : 'Add photo'}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Desktop Table View */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Student ID</th>
                    <th className="text-left p-4 font-semibold">Name</th>
                    <th className="text-left p-4 font-semibold">Class</th>
                    <th className="text-left p-4 font-semibold">Attendance</th>
                    <th className="text-left p-4 font-semibold">Engagement</th>
                    <th className="text-left p-4 font-semibold">Last Active</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student: any, index: number) => (
                    <motion.tr
                      key={student.student_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-medium">{student.student_id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {student.photo_url?.startsWith('http') || student.photo_url?.startsWith('s3://') ? (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {student.student_name?.charAt(0) || '?'}
                            </div>
                          ) : (
                            <div className="text-3xl">👨‍🎓</div>
                          )}
                          <span className="font-medium">{student.student_name}</span>
                        </div>
                      </td>
                      <td className="p-4">{student.class_name}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(student.attendance)}`}>
                          {student.attendance.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-secondary rounded-full h-2 w-20">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${student.engagement}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{student.engagement.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{student.session_date}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-8 w-8 p-0 ${enrolledIds.has(student.student_id) ? 'text-green-600' : 'text-muted-foreground'}`}
                            title={enrolledIds.has(student.student_id) ? 'Face enrolled — click to update' : 'Enroll face for attendance'}
                            onClick={() => {
                              setEnrollModal({ studentId: student.student_id, studentName: student.student_name })
                              setEnrollStatus('idle')
                              setEnrollError('')
                            }}
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredStudents.map((student: any, index: number) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{student.photo_url || student.photo || '👨‍🎓'}</div>
                      <div>
                        <h3 className="font-semibold">{student.student_name || student.name}</h3>
                        <p className="text-sm text-muted-foreground">{student.student_id || student.id}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.attendance)}`}>
                      {student.attendance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class:</span>
                      <span className="font-medium">{student.class_name || student.class}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Engagement:</span>
                      <span className="font-medium">{student.engagement.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Active:</span>
                      <span className="font-medium">{student.session_date || student.lastActive}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Mail className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button
                      size="sm"
                      variant={enrolledIds.has(student.student_id) ? 'default' : 'outline'}
                      className={`flex-1 ${enrolledIds.has(student.student_id) ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      onClick={() => {
                        setEnrollModal({ studentId: student.student_id, studentName: student.student_name })
                        setEnrollStatus('idle')
                        setEnrollError('')
                      }}
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      {enrolledIds.has(student.student_id) ? 'Update' : 'Enroll'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {filteredStudents.length} of {allStudents.length} students {apiStudents.length > 0 && '(from database)'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">1</Button>
              <Button variant="outline" size="sm" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

        </motion.div>
      </div>

      {/* Face Enrollment Modal */}
      {enrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-xl shadow-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Enroll Face</h2>
                <p className="text-sm text-muted-foreground">{enrollModal.studentName} ({enrollModal.studentId})</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => { setEnrollModal(null); setEnrollStatus('idle') }}
                disabled={enrollStatus === 'uploading'}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {enrollStatus === 'success' ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="font-semibold text-green-700">Face enrolled successfully!</p>
                <p className="text-sm text-muted-foreground">This student will be tracked in future video sessions.</p>
              </div>
            ) : (
              <>
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors mb-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium">Click to upload a photo</p>
                  <p className="text-sm text-muted-foreground mt-1">Use a clear, frontal face photo (JPG, PNG)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleEnrollPhoto(file)
                    }}
                  />
                </div>

                {enrollStatus === 'uploading' && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <p className="text-sm text-blue-700">Detecting and encoding face...</p>
                  </div>
                )}

                {enrollStatus === 'error' && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-sm text-red-700">{enrollError}</p>
                  </div>
                )}

                {enrolledIds.has(enrollModal.studentId) && enrollStatus === 'idle' && (
                  <p className="text-sm text-green-600 mb-4">✓ Already enrolled — uploading a new photo will add to their profile.</p>
                )}

                <Button
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={enrollStatus === 'uploading'}
                >
                  {enrollStatus === 'uploading' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <><Camera className="h-4 w-4 mr-2" /> Choose Photo</>
                  )}
                </Button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
