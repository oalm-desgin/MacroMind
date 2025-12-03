import { useState, useEffect } from 'react'
import { Target, TrendingUp, Utensils } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ToastContainer'

const SettingsPage = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('goals')

  useEffect(() => {
    console.log('PAGE LOADED:', window.location.pathname)
    console.log('SettingsPage mounted')
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-slate-600">
            Manage your profile and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-4 py-2 font-semibold text-sm transition-colors duration-300 border-b-2 ${
              activeTab === 'goals'
                ? 'text-indigo-600 border-indigo-500'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Fitness Goals
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 font-semibold text-sm transition-colors duration-300 border-b-2 ${
              activeTab === 'preferences'
                ? 'text-indigo-600 border-indigo-500'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Preferences
          </button>
        </div>

        {/* Content */}
        <div className="card">
          {activeTab === 'goals' ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-pink-100">
                  <Target className="text-indigo-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Fitness Goal
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Current goal: <span className="font-semibold capitalize">
                      {user?.profile?.fitness_goal || 'Not set'}
                    </span>
                  </p>
                  <button
                    onClick={() => {
                      showToast('Goal update feature coming soon!', 'info')
                    }}
                    className="btn-primary text-sm"
                  >
                    Update Goal
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-pink-100">
                  <TrendingUp className="text-indigo-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Daily Calories
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Current target: <span className="font-semibold">
                      {user?.profile?.daily_calories || 'Not set'} calories
                    </span>
                  </p>
                  <button
                    onClick={() => {
                      showToast('Calorie target update coming soon!', 'info')
                    }}
                    className="btn-primary text-sm"
                  >
                    Update Target
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-pink-100">
                  <Utensils className="text-indigo-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Dietary Preference
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Current preference: <span className="font-semibold capitalize">
                      {user?.profile?.dietary_preference || 'None'}
                    </span>
                  </p>
                  <button
                    onClick={() => {
                      showToast('Dietary preference update coming soon!', 'info')
                    }}
                    className="btn-primary text-sm"
                  >
                    Update Preference
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage

