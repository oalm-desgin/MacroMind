import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { Bot } from 'lucide-react'

const MessageList = ({ messages, loading }) => {
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Welcome Message */}
      {messages.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="p-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 mb-4">
            <Bot className="text-emerald-600" size={48} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Welcome to your AI Nutrition Coach!
          </h2>
          <p className="text-slate-600 max-w-md">
            I'm here to help you with nutrition advice, meal planning tips, and answer your questions about macros and healthy eating.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <div className="text-left p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500">Try asking:</p>
              <p className="text-sm text-indigo-600 mt-1 font-medium">"What are the best protein sources?"</p>
            </div>
            <div className="text-left p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500">Try asking:</p>
              <p className="text-sm text-indigo-600 mt-1 font-medium">"How should I time my meals?"</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Typing Indicator */}
      {loading && <TypingIndicator />}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default MessageList

