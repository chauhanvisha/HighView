import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send, Plus, Trash2, Download } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  streamChat,
  getChatSessions, createChatSession, getChatSessionMessages,
  updateChatSession, deleteChatSession, ChatSession, Message,
} from '../services/aiCoachApi'

const SCENARIOS: Record<string, { emoji: string; title: string; color: string }> = {
  interview: { emoji: '🎯', title: 'Interview Prep', color: '#1C88FC' },
  inbox:     { emoji: '📥', title: 'Inbox Reset',   color: '#8b5cf6' },
  email:     { emoji: '✉️',  title: 'Email Writing', color: '#10b981' },
}

export default function AiCoachPage() {
  const { scenario = 'interview' } = useParams<{ scenario: string }>()
  const meta = SCENARIOS[scenario] || { emoji: '💬', title: scenario, color: '#1C88FC' }
  const navigate = useNavigate()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const activeSessionIdRef = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { activeSessionIdRef.current = activeSessionId }, [activeSessionId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Load sessions
  useEffect(() => {
    setLoading(true)
    getChatSessions(scenario).then(async (list) => {
      setSessions(list)
      if (list.length === 0) {
        await startNewSession()
      } else {
        const latest = list[0]
        setActiveSessionId(latest.id)
        const msgs = await getChatSessionMessages(latest.id)
        setMessages(msgs.filter(m => !m.content.startsWith('Error:')))
        setLoading(false)
        if (msgs.length === 0) sendOpener()
      }
    }).catch(() => { setLoading(false); sendOpener() })
  }, [scenario])

  function scheduleSave(msgs: Message[]) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const id = activeSessionIdRef.current
      if (id) updateChatSession(id, msgs).catch(() => {})
    }, 1000)
  }

  async function startNewSession() {
    try {
      const name = `${meta.title} (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
      const session = await createChatSession(scenario, name)
      activeSessionIdRef.current = session.id
      setActiveSessionId(session.id)
      setSessions(prev => [session, ...prev])
      setMessages([])
      setLoading(false)
      sendOpener()
    } catch {
      setLoading(false)
      sendOpener()
    }
  }

  function sendOpener() {
    sendMessage([{ role: 'user', content: `[The student just selected the ${meta.title} scenario. Start directly with your opening for that coaching flow.]` }], true)
  }

  function sendMessage(msgs: Message[], isOpener = false) {
    setStreaming(true)
    let accumulated = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    streamChat(msgs, scenario, 2,
      (chunk) => {
        accumulated += chunk
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: accumulated }; return u })
      },
      () => {
        setStreaming(false)
        if (isOpener) {
          const opener = [{ role: 'assistant' as const, content: accumulated }]
          setMessages(opener)
          scheduleSave(opener)
        } else {
          setMessages(prev => { scheduleSave(prev); return prev })
        }
      },
      (err) => {
        setStreaming(false)
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: `Error: ${err}` }; return u })
      },
    )
  }

  function handleSend() {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = '44px'
    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    sendMessage(newMessages)
  }

  async function handleNewChat() {
    if (streaming || loading) return
    const id = activeSessionIdRef.current
    if (id && messages.length > 0) updateChatSession(id, messages).catch(() => {})
    setMessages([])
    setLoading(true)
    await startNewSession()
  }

  async function handleDeleteSession(id: string) {
    if (streaming) return
    await deleteChatSession(id).catch(() => {})
    const remaining = sessions.filter(s => s.id !== id)
    setSessions(remaining)
    if (id === activeSessionId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id)
        const msgs = await getChatSessionMessages(remaining[0].id)
        setMessages(msgs)
      } else {
        await startNewSession()
      }
    }
  }

  async function switchSession(id: string) {
    if (streaming || loading || id === activeSessionId) return
    setLoading(true)
    const currentId = activeSessionIdRef.current
    if (currentId && messages.length > 0) updateChatSession(currentId, messages).catch(() => {})
    setActiveSessionId(id)
    const msgs = await getChatSessionMessages(id)
    setMessages(msgs.filter(m => !m.content.startsWith('Error:')))
    setLoading(false)
  }

  function handleDownload() {
    const lines = [`HighView AI Coach — ${meta.title}\nDate: ${new Date().toLocaleDateString()}\n${'─'.repeat(50)}\n`]
    for (const msg of messages) {
      if (msg.content.startsWith('Error:') || msg.content.startsWith('[The student')) continue
      lines.push(`${msg.role === 'user' ? 'You' : 'Coach'}:\n${msg.content.trim()}\n`)
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `highview-${scenario}-${Date.now()}.txt`
    a.click()
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="shrink-0 bg-white border-b px-4 h-14 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/courses/ai')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <span className="text-xl">{meta.emoji}</span>
        <h1 className="font-bold text-gray-800">{meta.title}</h1>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={handleDownload} disabled={messages.length === 0}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r bg-white shrink-0 overflow-y-auto">
          <div className="p-3">
            <Button size="sm" className="w-full" onClick={handleNewChat} disabled={streaming}>
              <Plus className="h-4 w-4 mr-1" /> New Chat
            </Button>
          </div>
          <div className="px-3 space-y-1 flex-1">
            {sessions.map(s => (
              <div key={s.id}
                className={`group flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer text-sm transition-all
                  ${s.id === activeSessionId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => switchSession(s.id)}>
                <span className="truncate flex-1">{s.name}</span>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id) }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex flex-col flex-1 min-w-0">
          <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="flex gap-1.5">
                  {[0,150,300].map(d => (
                    <span key={d} className="w-2.5 h-2.5 rounded-full animate-bounce bg-blue-400"
                      style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            ) : messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mr-2"
                    style={{ background: `${meta.color}20` }}>🎓</div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
                  ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border text-gray-700 rounded-bl-sm shadow-sm'}`}>
                  {msg.content || (streaming && i === messages.length - 1 ? '...' : '')}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </main>

          {/* Input */}
          <div className="shrink-0 p-4 bg-white border-t">
            <div className="flex gap-2 items-end">
              <textarea ref={textareaRef} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Type your message..."
                rows={1} disabled={streaming || loading}
                className="flex-1 resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 max-h-32 overflow-y-auto"
                style={{ minHeight: '44px' }}
                onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 128)}px` }}
              />
              <Button onClick={handleSend} disabled={!input.trim() || streaming || loading}
                className="h-11 w-11 rounded-xl p-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
