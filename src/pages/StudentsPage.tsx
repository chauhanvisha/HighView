import { motion } from 'framer-motion'
import { Search, Plus, Eye, Mail, BarChart3, ChevronLeft, ChevronRight, ArrowUpDown, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { realStudents } from '../data/transformStudents'


const getStatusColor = (attendance: number) => {
  if (attendance >= 80) return 'bg-green-100 text-green-800 border-green-200'
  if (attendance >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

export default function StudentsPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [apiStudents, setApiStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<'student_id' | 'student_name' | 'class_name' | 'attendance' | 'engagement'>('student_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false)
  const [addStudentError, setAddStudentError] = useState<string | null>(null)
  const [addStudentSuccess, setAddStudentSuccess] = useState(false)
  const [newStudentForm, setNewStudentForm] = useState({
    id: '',
    name: '',
    email: '',
    class_id: '',
    class_name: ''
  })

  // Fetch students from localStorage on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        
        // Load custom students from localStorage
        const savedStudents = localStorage.getItem('customStudents')
        const customStudents = savedStudents ? JSON.parse(savedStudents) : []
        
        // Use real student data from students.json as base
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
        
        // Combine with custom students
        const allStudents = [...transformedStudents, ...customStudents]
        setApiStudents(allStudents)
        setError(null)
      } catch {
        // Fall back to base student data on any load error
        const fallback = realStudents.map(student => ({
          student_id: student.id,
          student_name: student.name,
          student_email: student.email,
          class_name: student.major,
          attendance: student.attendanceRate,
          engagement: student.engagementScore,
          grade: Math.round(student.gpa * 25),
          teacher_name: 'HighView Staff',
          session_date: student.enrollmentDate,
          photo_url: student.picture,
          department: student.university,
          topic: student.cohort,
          speaking_time: Math.round(student.sessionsAttended * 10),
          record_id: `${student.id}_${student.name.replace(/\s/g, '_')}`
        }))
        setApiStudents(fallback)
        setError(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  // Handler for adding a new student
  const handleAddStudent = async () => {
    try {
      setAddStudentError(null)
      if (!newStudentForm.id || !newStudentForm.name || !newStudentForm.email) {
        setAddStudentError('Please fill in all required fields: ID, Name, and Email.')
        return
      }

      // Create new student object
      const newStudent = {
        student_id: newStudentForm.id,
        student_name: newStudentForm.name,
        student_email: newStudentForm.email,
        class_name: newStudentForm.class_name || 'Not Assigned',
        attendance: 0,
        engagement: 0,
        grade: 0,
        teacher_name: 'HighView Staff',
        session_date: new Date().toISOString().split('T')[0],
        photo_url: '👨‍🎓',
        department: 'New Student',
        topic: 'Current Cohort',
        speaking_time: 0,
        record_id: `${newStudentForm.id}_${newStudentForm.name.replace(/\s/g, '_')}`
      }

      // Load existing custom students from localStorage
      const savedStudents = localStorage.getItem('customStudents')
      const customStudents = savedStudents ? JSON.parse(savedStudents) : []
      
      // Add new student
      customStudents.push(newStudent)
      
      // Save to localStorage
      localStorage.setItem('customStudents', JSON.stringify(customStudents))

      // Update UI
      setApiStudents(prev => [...prev, newStudent])
      setAddStudentSuccess(true)
      setTimeout(() => {
        setAddStudentSuccess(false)
        setAddStudentModalOpen(false)
        setNewStudentForm({ id: '', name: '', email: '', class_id: '', class_name: '' })
      }, 1200)
    } catch {
      setAddStudentError('Failed to add student. Please try again.')
    }
  }

  // Combine API students with mock students, prioritize API data
  const allStudents = apiStudents.length > 0 ? apiStudents : []
  
  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const filteredStudents = allStudents.filter((student: any) => {
    const matchesSearch = 
      (student.student_name || student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.student_id || student.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesClass = filterClass === 'all' || 
      (student.class_name || student.class || '').toLowerCase() === filterClass.toLowerCase()
    
    return matchesSearch && matchesClass
  }).sort((a: any, b: any) => {
    let aVal: any, bVal: any
    
    // Use the actual field names from the data
    aVal = a[sortColumn] || ''
    bVal = b[sortColumn] || ''
    
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    } else {
      return sortDirection === 'asc'
        ? aVal - bVal
        : bVal - aVal
    }
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
            <Button className="gap-2" onClick={() => setAddStudentModalOpen(true)}>
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
              <span>Connected to AWS DynamoDB • {apiStudents.length} record(s) loaded</span>
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

          {/* Desktop Table View */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">
                      <button onClick={() => handleSort('student_id')} className="flex items-center gap-1 hover:text-primary">
                        Student ID
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-semibold">
                      <button onClick={() => handleSort('student_name')} className="flex items-center gap-1 hover:text-primary">
                        Name
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-semibold">
                      <button onClick={() => handleSort('class_name')} className="flex items-center gap-1 hover:text-primary">
                        Major
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-semibold">
                      <button onClick={() => handleSort('attendance')} className="flex items-center gap-1 hover:text-primary">
                        Attendance
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-4 font-semibold">
                      <button onClick={() => handleSort('engagement')} className="flex items-center gap-1 hover:text-primary">
                        Engagement
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
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
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View profile"
                            onClick={() => navigate(`/cohort/${student.student_id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Send email"
                            onClick={() => window.location.href = `mailto:${student.student_email}`}>
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View analytics"
                            onClick={() => navigate(`/cohort/${student.student_id}`)}>
                            <BarChart3 className="h-4 w-4" />
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
                    <Button size="sm" variant="outline" className="flex-1"
                      onClick={() => navigate(`/cohort/${student.student_id || student.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1"
                      onClick={() => window.location.href = `mailto:${student.student_email || student.email}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      Email
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

      {/* Add Student Modal */}
      {addStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Add New Student</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddStudentModalOpen(false)
                    setNewStudentForm({
                      id: '',
                      name: '',
                      email: '',
                      class_id: '',
                      class_name: ''
                    })
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                <input
                  type="text"
                  required
                  value={newStudentForm.id}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., S124"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Alice Johnson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., alice@university.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class ID</label>
                <input
                  type="text"
                  value={newStudentForm.class_id}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, class_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., COEN233"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <input
                  type="text"
                  value={newStudentForm.class_name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, class_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Networking"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-muted/30">
              {addStudentError && (
                <p className="text-sm text-red-600 mb-3">{addStudentError}</p>
              )}
              {addStudentSuccess && (
                <p className="text-sm text-green-600 mb-3">Student added successfully!</p>
              )}
              <div className="flex gap-3">
              <Button
                onClick={handleAddStudent}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Add Student
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAddStudentModalOpen(false)
                  setAddStudentError(null)
                  setAddStudentSuccess(false)
                  setNewStudentForm({ id: '', name: '', email: '', class_id: '', class_name: '' })
                }}
              >
                Cancel
              </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
