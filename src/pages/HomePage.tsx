import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import StatsSection from '../components/StatsSection'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { BarChart3, Users, TrendingUp, Clock, Award, Target, MessageCircle, X } from 'lucide-react'
import { realStudents } from '../data/transformStudents'

// FAQ Responses
const FAQ_RESPONSES: Record<string, string> = {
  'how does it work': '🎥 HighView uses AI to automatically track attendance from classroom videos!\n\nHere\'s the process:\n1. Upload a classroom video\n2. Our face recognition AI detects and recognizes student faces\n3. We track engagement, speaking time, and attendance\n4. View results in real-time dashboards\n\nPowered by local face recognition AI and Claude AI! 🤖',
  'pricing': '💰 Simple, transparent pricing:\n\n🆓 Free Tier: Up to 100 students, 10 hours of video per month\n⭐ Pro ($49/month): Up to 500 students, unlimited video processing\n🏢 Enterprise (Custom): Unlimited students, dedicated support\n\nTry free tier - no credit card required!',
  'features': '✨ Key Features:\n\n📊 Attendance Tracking: 95%+ accuracy\n🎯 Engagement Scoring: Head orientation analysis\n🗣️ Speaking Time: Participation analytics\n🤖 AI Analytics: Ask questions about your data\n📈 Real-time Dashboards: Live updates',
  'get started': '🚀 Getting Started is Easy!\n\n1️⃣ Sign Up: Create free account\n2️⃣ Upload Student Photos: JPG or PNG format\n3️⃣ Upload Classroom Video: MP4 format\n4️⃣ View Results: Check dashboard in 5-15 minutes\n\n📧 Need help? demo@highview.com',
  'contact': '📞 Contact Us:\n\n📧 Email: support@highview.com\n💬 Live Chat: Available 9 AM - 5 PM EST\n🌐 Website: highview.com',
  'accurate': '🎯 Accuracy: 95%+ accurate\n• Face detection: 99%+ in good lighting\n• Face matching: 95%+ with quality photos\n\n💡 Depends on video quality, lighting, and clear student photos',
}

const quickQuestions = [
  '🎥 How does it work?',
  '💰 What are the pricing plans?',
  '✨ What features do you offer?',
  '🚀 How do I get started?',
  '🎯 How accurate is it?',
  '📧 How can I contact support?'
]

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

// FAQ Chatbot Component (for landing page)
function FAQChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '👋 Hi! I can help answer common questions about HighView. What would you like to know?' }
  ])
  const [input, setInput] = useState('')

  const findBestMatch = (query: string): string => {
    const q = query.toLowerCase()
    
    for (const [keywords, response] of Object.entries(FAQ_RESPONSES)) {
      if (q.includes(keywords)) {
        return response
      }
    }
    
    return `🤔 I'm not sure about that. Try asking about:\n\n${quickQuestions.slice(0, 4).map(q => `• ${q}`).join('\n')}\n\n📧 Or contact us: support@highview.com`
  }

  const sendMessage = () => {
    if (!input.trim()) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])

    const response = findBestMatch(input)
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    }, 500)

    setInput('')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-50"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-t-lg">
            <h3 className="font-bold text-lg">Quick Help</h3>
            <p className="text-sm opacity-90">Ask me anything!</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow border border-gray-100'}`}>
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          {messages.length === 1 && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-600 mb-2 font-semibold">Quick questions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.slice(0, 4).map((q, idx) => (
                  <button key={idx} onClick={() => setInput(q)} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-left">{q}</button>
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
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={sendMessage} disabled={!input.trim()} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50">
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<'teacher' | 'student'>('student')
  const [user, setUser] = useState<any>(null)

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

  // If not authenticated, show landing page
  if (!isAuthenticated) {
    return (
      <div>
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <FAQChatbot />
        
        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 px-8 py-16 md:px-16 md:py-20"
            >
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-300 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 text-center max-w-3xl mx-auto">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-8"
                >
                  Ready to transform your school?
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-base px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
                  >
                    Contact sales
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    )
  }

  // Teacher Dashboard
  if (userRole === 'teacher') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}! Here's an overview of your cohort.</p>
          </motion.div>

          {/* Real student count stat */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                    <p className="text-3xl font-bold">{realStudents.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">2026-27 College Cohort</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Attendance</p>
                    <p className="text-3xl font-bold">—</p>
                    <p className="text-xs text-muted-foreground mt-1">Available after sessions start</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Engagement</p>
                    <p className="text-3xl font-bold">—</p>
                    <p className="text-xs text-muted-foreground mt-1">Available after sessions start</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Link to full student list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                HighView Cohort
              </h3>
              <p className="text-muted-foreground mb-4">
                {realStudents.length} students enrolled. Class sessions have not started yet — attendance and engagement data will populate once recordings are processed.
              </p>
              <Link to="/students">
                <Button>View All Students</Button>
              </Link>
            </Card>
          </motion.div>
        </div>
        <TeacherAIChatbot />
      </div>
    )
  }

  // Student Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}! Track your progress and performance.</p>
        </motion.div>

        {/* Student Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: TrendingUp, label: 'My Engagement', value: '—', color: 'text-green-600', bg: 'bg-green-50' },
            { icon: Clock, label: 'Attendance Rate', value: '—', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Award, label: 'Current Grade', value: '—', color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: Target, label: 'Sessions Attended', value: '—', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">Available after sessions start</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-full`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* My Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              My Courses
            </h3>
            <p className="text-muted-foreground text-sm">Course data will appear once sessions are processed.</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Upcoming Tasks
            </h3>
            <p className="text-muted-foreground text-sm">No upcoming tasks at this time.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
