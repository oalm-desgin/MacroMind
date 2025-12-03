import { MessageCircle, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const AICoachCard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const profile = user?.profile || {}
  const coachingTone = profile.motivation_tone || 'Supportive'
  const mainGoal = profile.main_goal || 'Improve Health'
  const biggestStruggle = profile.biggest_struggle || 'General wellness'

  const getCoachingMessage = () => {
    const toneMessages = {
      'Supportive': `I'm here to support you on your journey to ${mainGoal.toLowerCase()}. Let's work together!`,
      'Direct': `Your goal is ${mainGoal.toLowerCase()}. Let's make it happen with focused action.`,
      'Tough Love': `You want ${mainGoal.toLowerCase()}. Time to commit and push through the challenges.`
    }
    return toneMessages[coachingTone] || toneMessages['Supportive']
  }

  return (
    <div className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:bg-slate-800/50 hover:border-purple-500/30 transition-all duration-300 cursor-pointer"
         onClick={() => navigate('/ai-coach')}>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 shadow-lg">
          <Sparkles className="text-white" size={24} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">AI Coach</h2>
            <MessageCircle className="text-purple-400" size={20} />
          </div>
          
          <p className="text-sm text-gray-300 mb-3 leading-relaxed bg-slate-900/30 rounded-lg p-3 border border-white/5">
            {getCoachingMessage()}
          </p>
          
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-gray-400">Focus:</span>
              <span className="ml-1 font-semibold text-gray-200">{biggestStruggle}</span>
            </div>
            <div>
              <span className="text-gray-400">Tone:</span>
              <span className="ml-1 font-semibold text-gray-200">{coachingTone}</span>
            </div>
          </div>
          
          <button className="mt-4 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 hover:from-purple-100 hover:to-pink-100 transition-all">
            Chat with Coach →
          </button>
        </div>
      </div>
    </div>
  )
}

export default AICoachCard

