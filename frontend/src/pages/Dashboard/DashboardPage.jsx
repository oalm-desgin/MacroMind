import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Lock } from 'lucide-react'
import Navbar from '../../components/Navbar'
import MacroSummary from './MacroSummary'
import WeeklyProgressChart from './WeeklyProgressChart'
import TodaysMeals from './TodaysMeals'
import GoalCard from './GoalCard'
import GoalSummaryCard from './GoalSummaryCard'
import AICoachCard from './AICoachCard'
import MentalFocusCard from './MentalFocusCard'
import QuickActions from '../../components/QuickActions'
import DailyTip from '../../components/DailyTip'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import mealPlannerService from '../../services/mealPlannerService'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ToastContainer.jsx'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user, isGuest } = useAuth()
  const { showToast } = useToast()

  const [todaysMeals, setTodaysMeals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generatingPlan, setGeneratingPlan] = useState(false)

  const fetchTodaysMeals = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await mealPlannerService.getTodaysMeals()
      setTodaysMeals(data)
    } catch (err) {
      console.error("Today's meals error:", err)
      if (err.response?.status === 404 || err.response?.status === 400) {
        setTodaysMeals(null)
        setError(null)
      } else {
        setError(err.response?.data?.detail || 'Failed to load meals.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateWeeklyPlan = async () => {
    if (isGuest) {
      console.log('[NAV] Redirect → /auth')
      navigate('/auth')
      return
    }

    // Navigate to meal planner and immediately trigger generation
    console.log('[NAV] Redirect → /meal-planner (startWizard)')
    navigate('/meal-planner', { state: { startWizard: true } })
  }

  const handleUpdateGoal = () => {
    if (isGuest) {
      console.log('[NAV] Redirect → /auth')
      navigate('/auth')
      return
    }

    console.log('[NAV] Redirect → /settings')
    navigate('/settings')
  }

  useEffect(() => {
    fetchTodaysMeals()
  }, [])

  useEffect(() => {
    console.log('Dashboard mounted → Router works:', typeof navigate === 'function')
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* WELCOME HERO BANNER */}
        <div className="mb-8 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-xl">
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
            {isGuest ? 'Welcome to MacroMind' : `Welcome back, ${user?.email?.split('@')[0] || 'User'}`}
          </h1>
          <p className="text-gray-300 text-lg">
            {isGuest ? 'Explore your nutrition journey' : 'Your personalized command center'}
          </p>
          {isGuest && (
            <div className="mt-4 p-4 bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-xl">
              <span className="text-gray-300">Guest mode active.{' '}</span>
              <Link to="/auth" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 underline font-medium">
                Register to unlock features
              </Link>
            </div>
          )}
        </div>

        {/* GENERATE BUTTON */}
        <div className="mb-6">
          <button
            type="button"
            disabled={isGuest || generatingPlan}
            onClick={handleGenerateWeeklyPlan}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGuest ? (
              <>
                <Lock size={18} />
                Register to Generate
              </>
            ) : generatingPlan ? (
              'Generating...'
            ) : (
              <>
                <Calendar size={18} />
                Generate Weekly Meal Plan
              </>
            )}
          </button>
        </div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

          {/* Show personalized content if user completed onboarding */}
          {user?.profile?.has_completed_onboarding ? (
            <>
              {/* Goal Summary - spans 2 columns */}
              <div className="md:col-span-2 lg:col-span-2 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-xl hover:bg-slate-900/50 transition-all">
                <GoalSummaryCard />
              </div>
              
              {/* AI Coach - spans 2 columns */}
              <div className="md:col-span-2 lg:col-span-2 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-xl hover:bg-slate-900/50 transition-all">
                <AICoachCard />
              </div>
              
              {/* Mental Focus - spans 1 column */}
              <div className="md:col-span-1 lg:col-span-1 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-xl hover:bg-slate-900/50 transition-all">
                <MentalFocusCard />
              </div>
              
              {/* Today's Meal Plan - spans 2 columns */}
              <div className="md:col-span-2 lg:col-span-2 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-xl hover:bg-slate-900/50 transition-all min-h-[500px] flex flex-col">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mb-4">Today's Meal Plan</h2>
                {loading ? (
                  <LoadingSpinner />
                ) : error ? (
                  <ErrorMessage message={error} onRetry={fetchTodaysMeals} />
                ) : todaysMeals ? (
                  <div className="flex-1">
                    <MacroSummary todaysMeals={todaysMeals} />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8 text-gray-300">
                      No meal plan yet. Generate one to get started!
                    </div>
                  </div>
                )}
              </div>
              
              {/* Weekly Progress - spans 2 columns */}
              <div className="md:col-span-2 lg:col-span-2 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-xl hover:bg-slate-900/50 transition-all">
                <WeeklyProgressChart />
              </div>
            </>
          ) : (
            <>
              <div className="md:col-span-2 lg:col-span-2 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-xl hover:bg-slate-900/50 transition-all">
                <QuickActions />
              </div>
              <div className="md:col-span-1 lg:col-span-1 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-xl hover:bg-slate-900/50 transition-all">
                <DailyTip />
              </div>
              <div className="md:col-span-1 lg:col-span-1 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-xl hover:bg-slate-900/50 transition-all">
                <GoalCard user={user} />
              </div>
            </>
          )}

          {/* Today's Meals - spans 2 columns, always visible */}
          <div className="md:col-span-2 lg:col-span-2 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-xl hover:bg-slate-900/50 transition-all min-h-[500px] flex flex-col">
            <TodaysMeals
              meals={todaysMeals?.meals || []}
              date={todaysMeals?.date}
              onMealUpdated={fetchTodaysMeals}
            />
          </div>

        </div>
      </div>
    </div>
  )
}

export default DashboardPage
