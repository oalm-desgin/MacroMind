import { Target, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const GoalSummaryCard = () => {
  const { user } = useAuth()
  const profile = user?.profile || {}

  const currentWeight = profile.current_weight
  const goalWeight = profile.goal_weight
  const mainGoal = profile.main_goal || 'Improve Health'
  const activityLevel = profile.activity_level || 'Moderate'

  const getGoalIcon = () => {
    if (!currentWeight || !goalWeight) return Minus
    
    if (goalWeight < currentWeight) return TrendingDown
    if (goalWeight > currentWeight) return TrendingUp
    return Minus
  }

  const GoalIcon = getGoalIcon()

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-600/20 border border-purple-500/30">
          <Target className="text-purple-300" size={24} />
        </div>
        
        <div className="flex-1">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mb-3">Current Goal Summary</h2>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-400">Main Goal:</span>
                <span className="text-sm font-semibold text-white">{mainGoal}</span>
              </div>
            </div>
            
            {currentWeight && goalWeight && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <GoalIcon className="text-purple-400" size={16} />
                  <span className="text-sm text-gray-400">Weight Goal:</span>
                  <span className="text-sm font-semibold text-white">
                    {currentWeight} lbs → {goalWeight} lbs
                  </span>
                </div>
                <div className="text-xs text-gray-400 ml-6">
                  {Math.abs(goalWeight - currentWeight).toFixed(1)} lbs {goalWeight > currentWeight ? 'to gain' : 'to lose'}
                </div>
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Activity Level:</span>
                <span className="text-sm font-semibold text-white">{activityLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoalSummaryCard

