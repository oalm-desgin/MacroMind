import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, User, Bot, AlertCircle } from 'lucide-react'
import Navbar from '../../components/Navbar'
import aiCoachService from '../../services/aiCoachService'
import { useAuth } from '../../hooks/useAuth'

const AIChatPage = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    console.log('[AI_COACH] Page loaded')
    loadChatHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    if (!user || user.isGuest || !user.id) {
      console.log('[AI_COACH] Skipping chat history load for guest user')
      return
    }
    
    try {
      console.log('[AI_COACH] Loading chat history for user:', user.id)
      const history = await aiCoachService.getChatHistory(user.id, 20)
      console.log('[AI_COACH] Chat history loaded:', history)
      
      const formattedMessages = history.messages.reverse().map(msg => ([
        { 
          id: msg.id + '-user', 
          text: msg.user_message, 
          isUser: true, 
          timestamp: msg.timestamp 
        },
        { 
          id: msg.id + '-ai', 
          text: msg.ai_response, 
          isUser: false, 
          timestamp: msg.timestamp 
        }
      ])).flat()
      
      setMessages(formattedMessages)
    } catch (error) {
      console.error('[AI_COACH] Error loading chat history:', error)
      // Don't show error, just start with empty chat
    }
  }

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return

    // Check if user is guest
    if (!user || user.isGuest || !user.id) {
      addSystemMessage('Please register or log in to chat with the AI coach.')
      return
    }

    // Add user message immediately
    const userMessage = {
      id: Date.now() + '-user',
      text: messageText,
      isUser: true,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    try {
      setIsTyping(true)
      console.log('[AI_COACH] Sending message:', messageText)
      
      const response = await aiCoachService.sendMessage(messageText)
      console.log('[AI_COACH] Received AI response:', response)
      
      // Add AI response
      const aiMessage = {
        id: response.message_id + '-ai',
        text: response.ai_response || response.response || response.message,
        isUser: false,
        timestamp: response.timestamp || new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('[AI_COACH] Error sending message:', error)
      
      // Show system message instead of error box
      let systemMessage = "I'm having trouble connecting to the neural net. Please check your connection."
      
      if (error.response?.status === 401) {
        systemMessage = 'Please log in to chat with the AI coach.'
      } else if (error.response?.status === 429) {
        systemMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (error.response?.data?.detail) {
        systemMessage = error.response.data.detail
      }
      
      addSystemMessage(systemMessage)
    } finally {
      setIsTyping(false)
    }
  }

  const addSystemMessage = (text) => {
    const systemMessage = {
      id: Date.now() + '-system',
      text,
      isUser: false,
      isSystem: true,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, systemMessage])
  }

  const handleQuickPrompt = (prompt) => {
    handleSendMessage(prompt)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputMessage.trim() && !isTyping) {
      handleSendMessage(inputMessage)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const quickPrompts = [
    'Generate a high-protein breakfast idea',
    'Explain why I\'m craving sugar',
    'Adjust my plan for a rest day'
  ]

  const userName = user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Navbar />
      
      {/* Main Chat Container - Full Height */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            
            {/* Empty State - Welcome Screen */}
            {messages.length === 0 && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
              >
                {/* Large Greeting */}
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mb-8"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-6 shadow-lg shadow-purple-500/20">
                    <Sparkles className="text-purple-300" size={40} />
                  </div>
                  <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mb-3">
                    Hello, {userName}
                  </h2>
                  <p className="text-xl text-gray-300">
                    How can I fuel your day?
                  </p>
                </motion.div>

                {/* Quick Prompt Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
                  {quickPrompts.map((prompt, index) => (
                    <motion.button
                      key={prompt}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuickPrompt(prompt)}
                      className="p-6 bg-slate-800/40 backdrop-blur-lg border border-white/10 rounded-2xl text-left hover:bg-slate-800/60 hover:border-purple-500/30 transition-all shadow-lg hover:shadow-xl hover:shadow-purple-500/10"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30 flex-shrink-0">
                          <Sparkles className="text-purple-300" size={18} />
                        </div>
                        <p className="text-sm text-gray-200 font-medium leading-relaxed">
                          {prompt}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && <TypingIndicator />}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Input Area - Glassmorphism */}
        <div className="sticky bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about nutrition..."
                  disabled={isTyping}
                  rows={1}
                  className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-2xl rounded-br-sm px-6 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-500"
                  style={{
                    minHeight: '56px',
                    maxHeight: '120px'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                />
              </div>
              
              {/* Send Button - Gradient Circle */}
              <motion.button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
              >
                <Send size={20} />
              </motion.button>
            </form>
            <p className="text-xs text-gray-500 mt-2 ml-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Message Bubble Component
const MessageBubble = ({ message }) => {
  const { text, isUser, isSystem } = message

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex items-start gap-3 justify-center"
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 backdrop-blur-md border border-yellow-500/30 rounded-full">
          <AlertCircle className="text-yellow-400" size={16} />
          <p className="text-sm text-yellow-200">{text}</p>
        </div>
      </motion.div>
    )
  }

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-3 justify-end"
      >
        <div className="max-w-[80%] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl rounded-tr-sm px-6 py-3 shadow-lg">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>
        <div className="p-2 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex-shrink-0">
          <User className="text-purple-200" size={18} />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: -20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3 justify-start"
    >
      <div className="p-2 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex-shrink-0 relative">
        <Bot className="text-purple-300" size={18} />
        <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping opacity-75"></div>
      </div>
      <div className="max-w-[80%] bg-slate-800/80 backdrop-blur-md border border-white/10 text-slate-200 rounded-2xl rounded-tl-sm px-6 py-3 shadow-lg">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </motion.div>
  )
}

// Typing Indicator - Three Dot Animation
const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-3 justify-start"
    >
      <div className="p-2 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex-shrink-0">
        <Bot className="text-purple-300" size={18} />
      </div>
      <div className="bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-sm px-6 py-4 shadow-lg">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 bg-purple-400 rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-pink-400 rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-purple-400 rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default AIChatPage
