import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, Video, Upload, X, CheckCircle, Loader2, Users, Brain, AlertCircle, ClipboardList, CalendarPlus, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { videoService, VideoUploadProgress, VideoAnalysisResult } from '../services/videoService'
import { addToCalendar } from '../utils/calendarUtils'
import { realStudents } from '../data/transformStudents'

const recentActivities = [
  { event: 'Video Processed', detail: 'Data Science Workshop - 28 students detected', time: '2 hours ago' },
  { event: 'Session Created', detail: 'Web Development Q&A scheduled', time: '5 hours ago' },
  { event: 'Recording Uploaded', detail: 'ML Study Group video uploaded', time: '1 day ago' },
]

interface Session {
  id: number
  title: string
  date: string
  time: string
  type: 'Virtual' | 'In-Person'
  instructor: string
  enrolled: number
  rsvps: number
}

export default function SessionsPage() {
  const navigate = useNavigate()
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<VideoUploadProgress | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>('')
  const [result, setResult] = useState<VideoAnalysisResult | null>(null)
  const [processedVideos, setProcessedVideos] = useState<VideoAnalysisResult[]>([])
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)
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
  })
  const [customSessions, setCustomSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('sessions')
    return saved ? JSON.parse(saved) : []
  })

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
      }
    })

    // Combine generated and custom sessions
    return [...generatedSessions, ...customSessions]
  }, [customSessions])

  // Save custom sessions to localStorage
  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(customSessions))
  }, [customSessions])

  const handleAddSession = () => {
    if (!sessionFormData.title || !sessionFormData.date || !sessionFormData.time || !sessionFormData.instructor) {
      alert('Please fill in all required fields')
      return
    }

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
    })
    setEditingSession(null)
    setSessionModalOpen(false)
  }

  // const handleEditSession = (session: Session) => {
  //   setEditingSession(session)
  //   setSessionFormData({
  //     title: session.title,
  //     date: session.date,
  //     time: session.time,
  //     type: session.type,
  //     instructor: session.instructor,
  //   })
  //   setSessionModalOpen(true)
  // }

  // const handleDeleteSession = (sessionId: number) => {
  //   if (confirm('Are you sure you want to delete this session?')) {
  //     setCustomSessions(prev => prev.filter(s => s.id !== sessionId))
  //   }
  // }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserRole(user.type || 'student')
    }

    videoService.getAllVideos().then((videos) => {
      setProcessedVideos(videos.filter((v) => v.processingStatus === 'completed'))
    }).catch(() => {})
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('video/')) setUploadedFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file?.type.startsWith('video/')) setUploadedFile(file)
  }

  const handleUpload = async () => {
    if (!uploadedFile || !selectedSession) return
    try {
      setUploading(true)
      setUploadProgress(null)
      setResult(null)

      const { videoId: newVideoId } = await videoService.uploadVideo(
        uploadedFile,
        selectedSession,
        (progress) => setUploadProgress(progress)
      )

      setUploading(false)
      setProcessing(true)

      const analysisResult = await videoService.waitForProcessing(newVideoId, (status) => {
        setProcessingStatus(status)
      })

      setProcessing(false)
      setResult(analysisResult)
      setProcessedVideos((prev) => [analysisResult, ...prev])
    } catch (error) {
      setUploading(false)
      setProcessing(false)
      setResult(null)
      alert(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const resetModal = () => {
    setUploadModalOpen(false)
    setUploadedFile(null)
    setUploadProgress(null)
    setProcessing(false)
    setResult(null)
  }

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

        {/* STUDENT VIEW - Live Sessions Table */}
        {userRole === 'student' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Live Sessions</h2>
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
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                          {session.type}
                        </span>
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
                        {session.type === 'Virtual' && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Video className="h-4 w-4" />
                            <span>Online Session</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Join Session
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
                              {/* Backdrop to close dropdown */}
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setCalendarDropdownOpen(null)}
                              />
                              
                              {/* Dropdown Menu */}
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={() => {
                                    addToCalendar({
                                      title: session.title,
                                      description: `Join us for ${session.title}`,
                                      location: session.type === 'Virtual' ? 'Online (Link will be provided)' : 'Campus',
                                      startDate: session.date,
                                      startTime: session.time.split(' - ')[0],
                                      endTime: session.time.split(' - ')[1],
                                      instructor: session.instructor,
                                    }, 'google')
                                    setCalendarDropdownOpen(null)
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                                >
                                  <Calendar className="h-4 w-4" />
                                  Google Calendar
                                </button>
                                <button
                                  onClick={() => {
                                    addToCalendar({
                                      title: session.title,
                                      description: `Join us for ${session.title}`,
                                      location: session.type === 'Virtual' ? 'Online (Link will be provided)' : 'Campus',
                                      startDate: session.date,
                                      startTime: session.time.split(' - ')[0],
                                      endTime: session.time.split(' - ')[1],
                                      instructor: session.instructor,
                                    }, 'ics')
                                    setCalendarDropdownOpen(null)
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                                >
                                  <CalendarPlus className="h-4 w-4" />
                                  Download ICS
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* STAFF VIEW - Manage RSVPs Table */}
        {userRole === 'staff' && (
          <>
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
                            <span className="text-sm text-muted-foreground">
                              {session.rsvps}/{session.enrolled} RSVPs
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
                        <div className="flex gap-3">
                          <Button 
                            size="sm"
                            onClick={() => navigate(`/sessions/${session.id}/attendance`)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                          >
                            <ClipboardList className="h-4 w-4" />
                            Manage RSVPs
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSession(session.title)
                              setResult(null)
                              setUploadedFile(null)
                              setUploadModalOpen(true)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Recording
                          </Button>
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
                    {recentActivities.map((activity, index) => (
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

        {/* Processed Recordings - Shown to both */}
        {processedVideos.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Processed Recordings</h2>
            <div className="space-y-4">
              {processedVideos.map((video) => (
                <Card key={video.videoId} className="overflow-hidden">
                  <div
                    className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedVideo(expandedVideo === video.videoId ? null : video.videoId)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{video.sessionTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(video.processedAt).toLocaleString()} · {Math.round(video.totalDuration / 60)} min video
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{video.attendance.length}</span>
                          <span className="text-muted-foreground">present</span>
                        </div>
                        {video.accuracy > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Brain className="h-4 w-4 text-purple-500" />
                            <span className="font-semibold">{video.accuracy}%</span>
                            <span className="text-muted-foreground">accuracy</span>
                          </div>
                        )}
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {expandedVideo === video.videoId && (
                    <div className="border-t px-5 pb-5 pt-4">
                      {video.attendance.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold mb-3 text-green-700">Present Students</p>
                          {video.attendance.map((s) => (
                            <div key={s.studentId} className={`p-3 rounded-lg border ${s.cameraOn === false ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-100'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  {s.cameraOn === false
                                    ? <AlertCircle className="h-4 w-4 text-amber-500" />
                                    : <CheckCircle className="h-4 w-4 text-green-600" />
                                  }
                                  <span className="text-sm font-medium">{s.studentName}</span>
                                  {s.cameraOn === false && (
                                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">camera off</span>
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-primary">{s.engagementScore}% engaged</span>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                                {s.wordCount > 0 && <span>{s.wordCount} words</span>}
                                {s.questionsAsked > 0 && <span>{s.questionsAsked} question{s.questionsAsked !== 1 ? 's' : ''}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <span>No enrolled students were detected in this recording. Enroll student photos first.</span>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Upload Modal - Same as before */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-xl max-w-lg w-full p-6 relative shadow-2xl"
          >
            <button
              onClick={resetModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              disabled={uploading || processing}
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-2xl font-bold mb-1">Upload Class Recording</h2>
            <p className="text-sm text-muted-foreground mb-6">{selectedSession}</p>

            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-green-800">Processing Complete</p>
                    <p className="text-sm text-green-700">{Math.round(result.totalDuration / 60)} min video analyzed</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-muted/40 rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">{result.attendance.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">Students Present</p>
                  </div>
                  <div className="p-4 bg-muted/40 rounded-lg text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {result.accuracy > 0 ? `${result.accuracy}%` : 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
                  </div>
                </div>

                {result.attendance.length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold mb-2">Detected Students</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {result.attendance.map((s) => (
                        <div key={s.studentId} className={`p-2 rounded border ${s.cameraOn === false ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-100'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {s.cameraOn === false
                                ? <AlertCircle className="h-4 w-4 text-amber-500" />
                                : <CheckCircle className="h-4 w-4 text-green-600" />
                              }
                              <span className="text-sm font-medium">{s.studentName}</span>
                              {s.cameraOn === false && (
                                <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">camera off</span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-primary">{s.engagementScore}%</span>
                          </div>
                          {(s.wordCount > 0 || s.questionsAsked > 0) && (
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1 ml-6">
                              {s.wordCount > 0 && <span>{s.wordCount} words</span>}
                              {s.questionsAsked > 0 && <span>{s.questionsAsked} question{s.questionsAsked !== 1 ? 's' : ''}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    No enrolled students detected. Upload student photos in the Students page first.
                  </div>
                )}

                <Button className="w-full" onClick={resetModal}>Done</Button>
              </div>
            ) : (
              <>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  {uploadedFile ? (
                    <div className="space-y-3">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                      <p className="font-semibold">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                      <Button variant="outline" size="sm" onClick={() => setUploadedFile(null)} disabled={uploading || processing}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Video className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="font-semibold">Drag and drop your video here</p>
                      <label>
                        <input type="file" accept="video/*" onChange={handleFileInput} className="hidden" />
                        <Button variant="outline" size="sm" asChild>
                          <span className="cursor-pointer">Browse Files</span>
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground">MP4, MOV, AVI supported</p>
                    </div>
                  )}
                </div>

                {uploadProgress && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Uploading...</span>
                      <span className="font-medium">{uploadProgress.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {processing && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">Analyzing with Face Recognition AI</p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        {processingStatus === 'processing' ? 'Scanning frames and matching faces...' : 'Initializing...'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handleUpload}
                    disabled={!uploadedFile || uploading || processing}
                    className="flex-1"
                  >
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                    ) : processing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                    ) : (
                      'Upload & Analyze'
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetModal} disabled={uploading || processing}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

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
    </div>
  )
}
