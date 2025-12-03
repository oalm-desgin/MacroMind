import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Utensils, Sun, CloudSun, Moon, RefreshCw, Lock } from 'lucide-react'
import mealPlannerService from '../../services/mealPlannerService'
import { useAuth } from '../../hooks/useAuth'

const TodaysMeals = ({ meals, date, onMealUpdated }) => {
  const navigate = useNavigate()
  const { isGuest } = useAuth()
  const [swappingMealId, setSwappingMealId] = useState(null)

  const handleSwapMeal = async (mealId) => {
    if (isGuest) {
      return // Guest mode - do nothing
    }

    try {
      setSwappingMealId(mealId)
      await mealPlannerService.swapMeal(mealId)
      // Refresh meals after swap
      if (onMealUpdated) {
        await onMealUpdated()
      }
    } catch (error) {
      console.error('Error swapping meal:', error)
      alert('Failed to swap meal. Please try again.')
    } finally {
      setSwappingMealId(null)
    }
  }
  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast':
        return Sun
      case 'lunch':
        return CloudSun
      case 'dinner':
        return Moon
      default:
        return Utensils
    }
  }

  const getMealTime = (mealType) => {
    switch (mealType) {
      case 'breakfast':
        return '8:00 AM'
      case 'lunch':
        return '1:00 PM'
      case 'dinner':
        return '7:00 PM'
      default:
        return ''
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mb-2">Today's Meals</h2>
      <p className="text-gray-400 text-sm mb-6">
        {date ? new Date(date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        }) : 'Today'}
      </p>

      <div className="space-y-4">
        {meals && meals.length > 0 ? (
          meals.map((meal, index) => {
            const Icon = getMealIcon(meal.meal_type)
            return (
              <div
                key={meal.id || index}
                className="p-4 rounded-xl bg-slate-800/40 backdrop-blur-md border border-white/10 hover:border-purple-500/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="text-purple-300" size={20} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white capitalize">
                          {meal.meal_type}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {getMealTime(meal.meal_type)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
                        {meal.calories} kcal
                      </span>
                    </div>

                    <p className="text-sm text-gray-200 mb-3 font-medium">
                      {meal.name}
                    </p>

                    {/* Macros */}
                    <div className="flex items-center gap-4 text-xs mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Protein:</span>
                        <span className="text-white font-semibold">{meal.protein}g</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Carbs:</span>
                        <span className="text-white font-semibold">{meal.carbs}g</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Fats:</span>
                        <span className="text-white font-semibold">{meal.fats}g</span>
                      </div>
                    </div>

                    {/* Swap Button */}
                    <button
                      onClick={() => handleSwapMeal(meal.id)}
                      disabled={isGuest || swappingMealId === meal.id}
                      className={`w-full mt-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        isGuest
                          ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
                          : swappingMealId === meal.id
                          ? 'bg-purple-500/30 text-purple-300 cursor-wait'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-md hover:shadow-purple-500/30 active:scale-95'
                      }`}
                    >
                      {isGuest ? (
                        <span className="flex items-center justify-center gap-1">
                          <Lock size={12} />
                          Register to Swap
                        </span>
                      ) : swappingMealId === meal.id ? (
                        <span className="flex items-center justify-center gap-1">
                          <RefreshCw size={12} className="animate-spin" />
                          Regenerating...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <RefreshCw size={12} />
                          Swap Meal
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <Utensils className="mx-auto text-gray-500 mb-3" size={40} />
            <p className="text-gray-300 text-sm font-medium mb-2">
              No meal plan yet.
            </p>
            <p className="text-gray-400 text-xs mb-4">
              Generate your first plan to get started.
            </p>
            <button
              type="button"
              onClick={() => {
                console.log('HARD NAV FIRED: Empty state button - navigating to /meal-planner')
                window.location.href = '/meal-planner'
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2 px-4 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 text-sm"
            >
              Go to Meal Planner
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TodaysMeals

