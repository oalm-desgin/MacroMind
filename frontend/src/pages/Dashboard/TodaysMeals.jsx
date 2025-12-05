import { Utensils, Sun, CloudSun, Moon } from 'lucide-react'

const TodaysMeals = ({ meals, date, onMealUpdated }) => {
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
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mb-2">Today's Meals</h2>
      <p className="text-gray-400 text-sm mb-6">
        {date ? new Date(date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        }) : 'Today'}
      </p>

      <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar-dark">
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

                    <p className="text-sm text-gray-200 mb-3 font-medium break-words">
                      {meal.name}
                    </p>

                    {/* Macros */}
                    <div className="flex items-center gap-4 text-xs">
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

