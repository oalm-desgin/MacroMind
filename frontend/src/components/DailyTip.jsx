import { useState, useEffect } from 'react'
import { Lightbulb, RefreshCw } from 'lucide-react'
import aiCoachService from '../services/aiCoachService'
import { useAuth } from '../hooks/useAuth'

const DailyTip = () => {
  const { isGuest } = useAuth()
  const [tip, setTip] = useState(null)
  const [loading, setLoading] = useState(false)

  const getCachedTip = () => {
    const cached = localStorage.getItem('daily_tip')
    if (!cached) return null

    const { tip: cachedTip, date } = JSON.parse(cached)
    const today = new Date().toDateString()
    
    // Return cached tip if it's from today
    if (date === today) {
      return cachedTip
    }
    
    return null
  }

  const fetchTip = async () => {
    if (isGuest) {
      setTip("Stay hydrated! Drink at least 8 glasses of water daily to support your metabolism and overall health.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const cached = getCachedTip()
      if (cached) {
        setTip(cached)
        setLoading(false)
        return
      }

      const response = await aiCoachService.sendMessage(
        "Give me one short daily nutrition tip (max 25 words)."
      )
      
      const newTip = response.response || response.message || "Eat a balanced diet with plenty of fruits and vegetables."
      const today = new Date().toDateString()
      
      localStorage.setItem('daily_tip', JSON.stringify({ tip: newTip, date: today }))
      setTip(newTip)
    } catch (error) {
      console.error('Error fetching daily tip:', error)
      setTip("Eat a balanced diet with plenty of fruits and vegetables for optimal nutrition.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTip()
  }, [])

  const handleRefresh = () => {
    localStorage.removeItem('daily_tip')
    fetchTip()
  }

  return (
    <div className="border-l-4 border-l-purple-500 hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
            <Lightbulb className="text-yellow-300 animate-pulse-slow" size={20} />
          </div>
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
            Daily Nutrition Tip
          </h2>
        </div>
        {!isGuest && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-purple-500/20 transition-colors duration-300"
            title="Refresh tip"
          >
            <RefreshCw 
              size={16} 
              className={`text-purple-300 ${loading ? 'animate-spin' : ''}`} 
            />
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
          <p className="text-sm">Loading tip...</p>
        </div>
      ) : tip ? (
        <p className="text-sm text-gray-300 leading-relaxed">{tip}</p>
      ) : (
        <p className="text-sm text-gray-400">No tip available</p>
      )}
    </div>
  )
}

export default DailyTip

