import { Target, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { FITNESS_GOAL_LABELS, DIETARY_PREFERENCE_LABELS } from '../../utils/constants'

const GoalCard = ({ user }) => {
  const getGoalIcon = (goal) => {
    switch (goal) {
      case 'cut':
        return TrendingDown
      case 'bulk':
        return TrendingUp
      default:
        return Activity
    }
  }

  const getGoalColor = (goal) => {
    switch (goal) {
      case 'cut':
        return 'text-emerald-300'
      case 'bulk':
        return 'text-pink-300'
      default:
        return 'text-purple-300'
    }
  }

  const goal = user?.profile?.fitness_goal || 'maintain'
  const GoalIcon = getGoalIcon(goal)
  const goalColor = getGoalColor(goal)

  return (
    <div className="hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-600/20 border border-purple-500/30 group-hover:shadow-lg transition-all duration-300">
            <Target className="text-purple-300" size={28} />
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mb-1">
              Current Goal
            </h2>
            <div className="flex items-center gap-2 mb-3">
              <GoalIcon className={goalColor} size={18} />
              <span className={`text-xl font-bold ${goalColor}`}>
                {FITNESS_GOAL_LABELS[goal]}
              </span>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Daily Calories:</span>
                <span className="text-white font-medium">
                  {user?.profile?.daily_calories || '2200'} kcal
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Diet Preference:</span>
                <span className="text-white font-medium">
                  {DIETARY_PREFERENCE_LABELS[user?.profile?.dietary_preference || 'none']}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator with Shimmer */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Weekly Adherence</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 font-semibold">85%</span>
        </div>
        <div className="mt-2 w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
          <div 
            className="h-2.5 rounded-full transition-all duration-500 relative"
            style={{ 
              width: '85%',
              background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #a855f7 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s linear infinite'
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default GoalCard

