import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send } from 'lucide-react'

const STORAGE_KEY = 'momma-chat-messages'
const MAX_STORED = 48

function loadStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return null
    return arr.slice(-MAX_STORED)
  } catch {
    return null
  }
}

function initialMessages() {
  const s = loadStored()
  if (s?.length) return s
  return [
    {
      role: 'assistant',
      content:
        "Hi! I'm **Momma**. Ask about your **calendar**, **spending**, **carbon footprint**, or your **briefing** — I use live data from this app. Add an API key in `.env` for richer, open-ended answers.",
    },
  ]
}

export default function MommaChat({ sendChat, sending, disabled }) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)))
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || disabled) return

    const userMsg = { role: 'user', content: text }
    const thread = [...messages, userMsg]
    setMessages(thread)
    setInput('')

    try {
      const assistant = await sendChat(thread)
      setMessages([...thread, assistant])
    } catch (err) {
      setMessages([
        ...thread,
        {
          role: 'assistant',
          content: `**Could not reach the assistant.** ${err.message ?? 'Try again in a moment.'}`,
        },
      ])
    }
  }

  return (
    <div className="momma-chat">
      <h3 className="agent-dock-section-label">Conversation</h3>
      <div className="momma-chat-messages" role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`momma-chat-bubble momma-chat-bubble-${m.role}`}
          >
            {m.role === 'assistant' ? (
              <div className="markdown-body momma-chat-md">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="momma-chat-user-text">{m.content}</p>
            )}
          </div>
        ))}
        {sending && (
          <div className="momma-chat-bubble momma-chat-bubble-assistant momma-chat-typing">
            <span className="momma-chat-dots" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <span className="sr-only">Momma is typing</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form className="momma-chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="momma-chat-input"
          placeholder={disabled ? 'Connect to the server to chat…' : 'Message Momma…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled || sending}
          maxLength={4000}
          autoComplete="off"
          aria-label="Message to Momma"
        />
        <button
          type="submit"
          className="btn btn-primary momma-chat-send"
          disabled={disabled || sending || !input.trim()}
          title="Send message"
        >
          <Send size={18} aria-hidden />
        </button>
      </form>
    </div>
  )
}
