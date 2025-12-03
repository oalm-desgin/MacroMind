import { Brain, Moon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const MentalFocusCard = () => {
  const { user } = useAuth()
  const profile = user?.profile || {}

  const biggestStruggle = profile.biggest_struggle || 'General wellness'
  const currentMentalState = profile.current_mental_state || 'Calm'
  const sleepQuality = profile.sleep_quality || 'Good'

  const getMentalStateColor = (state) => {
    const colors = {
      'Calm': 'text-emerald-300',
      'Stressed': 'text-orange-300',
      'Anxious': 'text-red-300',
      'Burned out': 'text-amber-300',
      'Motivated': 'text-purple-300'
    }
    return colors[state] || 'text-gray-300'
  }

  const getSleepQualityColor = (quality) => {
    const colors = {
      'Very Poor': 'text-red-300',
      'Poor': 'text-orange-300',
      'Fair': 'text-yellow-300',
      'Good': 'text-emerald-300',
      'Excellent': 'text-purple-300'
    }
    return colors[quality] || 'text-gray-300'
  }

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <Brain className="text-purple-300" size={24} />
        </div>
        
        <div className="flex-1">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mb-3">Mental Focus</h2>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-400">Focus Area:</span>
                <span className="text-sm font-semibold text-white">{biggestStruggle}</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-400">Current State:</span>
                <span className={`text-sm font-semibold ${getMentalStateColor(currentMentalState)}`}>
                  {currentMentalState}
                </span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <Moon className="text-purple-400" size={16} />
                <span className="text-sm text-gray-400">Sleep Quality:</span>
                <span className={`text-sm font-semibold ${getSleepQualityColor(sleepQuality)}`}>
                  {sleepQuality}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MentalFocusCard

