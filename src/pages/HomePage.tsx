import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, Navigate } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { MessageCircle, X, Calendar, Brain, Layers, CheckSquare } from 'lucide-react'
import CohortPage from './CohortPage'
import { cohortStudents } from '../data/transformStudents'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// AI Chatbot for Teachers (connects to AWS API)
function TeacherAIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '👋 Hi! I\'m your AI assistant. Ask me about attendance, engagement, or student analytics!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const API_URL = 'https://o35e0gmfl8.execute-api.us-east-1.amazonaws.com/prod/chat'

  const suggestions = [
    'How many students attended?',
    'Show engagement rankings',
    'Who was absent?',
    'What was the average attendance score?'
  ]

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMsg: Message = { role: 'user', content: input }
    const currentInput = input
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      console.log('=== CHATBOT DEBUG START ===')
      console.log('1. Sending message to API:', currentInput)
      console.log('2. API URL:', API_URL)
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput })
      })

      console.log('3. API Response status:', response.status)
      console.log('4. API Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('5. API Error response:', errorText)
        throw new Error(`API returned status ${response.status}: ${errorText}`)
      }

      const responseText = await response.text()
      console.log('6. Raw API Response:', responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
        console.log('7. Parsed API Response:', data)
      } catch (parseError) {
        console.error('8. Failed to parse JSON:', parseError)
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`)
      }
      
      // Handle different possible response formats
      let botResponse = ''
      
      if (data.response) {
        botResponse = data.response
        console.log('9. Using data.response')
      } else if (data.body) {
        console.log('10. Found data.body, parsing...')
        const bodyData = typeof data.body === 'string' ? JSON.parse(data.body) : data.body
        botResponse = bodyData.response || bodyData.message || JSON.stringify(bodyData)
      } else if (data.message) {
        botResponse = data.message
        console.log('11. Using data.message')
      } else if (data.answer) {
        botResponse = data.answer
        console.log('12. Using data.answer')
      } else {
        console.log('13. No standard field found, using full data')
        botResponse = JSON.stringify(data, null, 2)
      }
      
      console.log('14. Final bot response:', botResponse)
      console.log('=== CHATBOT DEBUG END ===')
      
      const botMessage: Message = { role: 'assistant', content: botResponse }
      setMessages(prev => [...prev, botMessage])

    } catch (error) {
      console.error('=== CHATBOT ERROR ===')
      console.error('Error details:', error)
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      console.error('=== ERROR END ===')
      
      const errorMessage: Message = { 
        role: 'assistant', 
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔍 Check browser console (F12) for detailed logs.\n\nCommon issues:\n• CORS not enabled on API\n• Wrong API endpoint\n• API not deployed` 
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-50"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[450px] h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg">
            <h3 className="font-bold text-lg">🤖 AI Analytics Assistant</h3>
            <p className="text-sm opacity-90">Ask me about your student data</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow border border-gray-100'}`}>
                  <p className="text-xs font-semibold mb-1 opacity-75">
                    {msg.role === 'user' ? 'You' : 'AI Assistant'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-lg shadow border border-gray-100">
                  <p className="text-sm text-gray-600">AI is thinking...</p>
                </div>
              </div>
            )}
          </div>

          {messages.length === 1 && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-600 mb-2 font-semibold">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion)}
                    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                placeholder="Ask about attendance, engagement..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button 
                onClick={sendMessage} 
                disabled={loading || !input.trim()} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true')
  const [userRole, setUserRole] = useState<'staff' | 'student'>(() => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) return JSON.parse(userData).type || 'student'
    } catch { /* ignore */ }
    return 'student'
  })
  const [user, setUser] = useState<any>(() => {
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    } catch { return null }
  })

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('isAuthenticated')
      const userData = localStorage.getItem('user')
      if (auth === 'true' && userData) {
        setIsAuthenticated(true)
        const parsed = JSON.parse(userData)
        setUser(parsed)
        setUserRole(parsed.type || 'student')
      }
    }

    checkAuth()

    // Listen for role changes
    const handleRoleChange = (e: any) => {
      setUserRole(e.detail)
    }

    window.addEventListener('roleChanged', handleRoleChange)
    return () => window.removeEventListener('roleChanged', handleRoleChange)
  }, [])

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Teacher Dashboard
  if (userRole === 'staff') {
    return (
      <>
        <CohortPage />
        <TeacherAIChatbot />
      </>
    )
  }

  // Student Dashboard
  const studentData = cohortStudents.find(s => s.email === user?.email)
  const pillars = [
    {
      icon: Brain,
      label: 'AI Learning',
      value: studentData?.ai ?? null,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      bar: 'bg-violet-500',
      description: 'AI & technology skill engagement',
    },
    {
      icon: Layers,
      label: 'Experiential Learning',
      value: studentData?.experiential ?? null,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      bar: 'bg-emerald-500',
      description: 'Hands-on and real-world learning',
    },
    {
      icon: CheckSquare,
      label: 'Session Attendance',
      value: studentData?.sessionAttendance ?? null,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      bar: 'bg-blue-500',
      description: 'Attendance rate across all sessions',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}! Here's your learning progress.</p>
        </motion.div>

        {/* Pillar Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {pillars.map((pillar, index) => {
            const pct = pillar.value !== null ? Math.round(pillar.value) : null
            return (
              <motion.div
                key={pillar.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`${pillar.bg} p-2.5 rounded-lg`}>
                      <pillar.icon className={`h-5 w-5 ${pillar.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{pillar.label}</p>
                      <p className="text-xs text-muted-foreground">{pillar.description}</p>
                    </div>
                  </div>
                  <div className="mb-2 flex items-end justify-between">
                    <span className={`text-3xl font-bold ${pillar.color}`}>
                      {pct !== null ? `${pct}%` : '—'}
                    </span>
                    {pct !== null && (
                      <span className="text-xs text-muted-foreground mb-1">
                        {pct >= 80 ? 'Excellent' : pct >= 60 ? 'On track' : 'Needs work'}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`${pillar.bar} h-2.5 rounded-full transition-all duration-700`}
                      style={{ width: pct !== null ? `${pct}%` : '0%' }}
                    />
                  </div>
                  {pct === null && (
                    <p className="text-xs text-muted-foreground mt-2">Available after sessions start</p>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 gap-6 max-w-md">
          <Link to="/sessions">
            <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Sessions
                </h3>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">View all →</span>
              </div>
              <p className="text-muted-foreground text-sm mb-4">Join live sessions and workshops</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-muted-foreground">Sessions scheduled this week</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-muted-foreground">RSVP to reserve your spot</span>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
