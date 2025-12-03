import { User, Bot, AlertCircle } from 'lucide-react'

const MessageBubble = ({ message }) => {
  const { text, isUser, isError } = message

  if (isError) {
    return (
      <div className="flex items-start gap-3 justify-start">
        <div className="p-2 rounded-full bg-red-100">
          <AlertCircle className="text-red-500" size={20} />
        </div>
        <div className="max-w-[70%] p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{text}</p>
        </div>
      </div>
    )
  }

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[70%] p-4 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md">
          <p className="text-sm">{text}</p>
        </div>
        <div className="p-2 rounded-full bg-gradient-to-br from-indigo-100 to-pink-100">
          <User className="text-indigo-600" size={20} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 justify-start animate-slide-up">
      <div className="p-2 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
        <Bot className="text-emerald-600" size={20} />
      </div>
      <div className="max-w-[70%] p-4 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-900 whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  )
}

export default MessageBubble

