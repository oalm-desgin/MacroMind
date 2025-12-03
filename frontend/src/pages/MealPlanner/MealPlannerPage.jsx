import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Calendar, Loader2, Utensils } from 'lucide-react'
import Navbar from '../../components/Navbar'
import mealPlannerService from '../../services/mealPlannerService'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ToastContainer'
import LoadingSpinner from '../../components/LoadingSpinner'

const MealPlannerPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isGuest } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [weeklyPlan, setWeeklyPlan] = useState(null)

  useEffect(() => {
    console.log('PAGE LOADED:', window.location.pathname)
    console.log('MealPlannerPage mounted')
  }, [])

  const handleGeneratePlan = async () => {
    if (isGuest) {
      showToast('Please register to generate meal plans', 'error')
      navigate('/auth')
      return
    }

    try {
      setGenerating(true)
      console.log('[NAVIGATION] Generating weekly meal plan...')
      const plan = await mealPlannerService.generateWeeklyPlan()
      setWeeklyPlan(plan)
      showToast('Weekly meal plan generated successfully!', 'success')
      // Clear the auto-generate flag
      window.history.replaceState({}, document.title)
    } catch (error) {
      console.error('Error generating meal plan:', error)
      showToast(
        error.response?.data?.detail || 'Failed to generate meal plan. Please try again.',
        'error'
      )
    } finally {
      setGenerating(false)
    }
  }

  // Check if we should auto-generate plan (from navigation state)
  useEffect(() => {
    const shouldAutoGenerate = location.state?.autoGenerate === true
    if (shouldAutoGenerate && !isGuest && !generating && !loading) {
      console.log('[NAVIGATION] Auto-generating meal plan on page load')
      handleGeneratePlan()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, isGuest])

  const fetchWeeklyPlan = async () => {
    try {
      setLoading(true)
      const plan = await mealPlannerService.getWeeklyPlan()
      setWeeklyPlan(plan)
    } catch (error) {
      console.error('Error fetching weekly plan:', error)
      if (error.response?.status !== 404) {
        showToast('Failed to load meal plan', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isGuest) {
      fetchWeeklyPlan()
    }
  }, [isGuest])

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Meal Planner
          </h1>
          <p className="text-slate-600">
            View and manage your weekly meal plan
          </p>
        </div>

        {isGuest ? (
          <div className="card text-center py-12">
            <Utensils className="mx-auto text-slate-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Register to Access Meal Planner
            </h2>
            <p className="text-slate-600 mb-6">
              Create an account to generate and manage your personalized meal plans.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary"
            >
              Register Now
            </button>
          </div>
        ) : loading || generating ? (
          <div className="card">
            <LoadingSpinner 
              message={generating ? 'Generating your meal plan...' : 'Loading meal plan...'} 
            />
          </div>
        ) : weeklyPlan ? (
          <div className="card">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Weekly Meal Plan</h2>
            <p className="text-slate-600">
              Your meal plan has been generated. Full meal planner interface coming soon!
            </p>
            <pre className="mt-4 p-4 bg-slate-50 rounded-lg text-xs overflow-auto">
              {JSON.stringify(weeklyPlan, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="card text-center py-12">
            <Calendar className="mx-auto text-slate-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              No Meal Plan Yet
            </h2>
            <p className="text-slate-600 mb-6">
              Generate your first weekly meal plan to get started.
            </p>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar size={18} />
                  Generate Weekly Plan
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MealPlannerPage

