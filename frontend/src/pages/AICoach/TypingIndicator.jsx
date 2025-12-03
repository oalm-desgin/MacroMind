import { Bot } from 'lucide-react'

const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-3 justify-start">
      <div className="p-2 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
        <Bot className="text-emerald-600" size={20} />
      </div>
      <div className="p-4 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-typing" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator

