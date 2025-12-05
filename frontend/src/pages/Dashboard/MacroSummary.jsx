import { Flame, Beef, Wheat, Droplet } from 'lucide-react'

const MacroSummary = ({ todaysMeals }) => {
  if (!todaysMeals || !todaysMeals.daily_totals) {
    return null
  }

  const { daily_totals } = todaysMeals
  const targetCalories = 2200 // This should come from user profile

  const macros = [
    {
      name: 'Calories',
      value: daily_totals.calories,
      unit: 'kcal',
      icon: Flame,
      iconColor: 'text-orange-500',
      iconBg: 'bg-gradient-to-br from-orange-100 to-red-100',
      progressGradient: 'from-orange-500 via-pink-500 to-purple-500',
      target: targetCalories,
      percentage: (daily_totals.calories / targetCalories) * 100
    },
    {
      name: 'Protein',
      value: daily_totals.protein,
      unit: 'g',
      icon: Beef,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-gradient-to-br from-emerald-100 to-teal-100',
      progressGradient: 'from-emerald-400 to-emerald-600',
      target: 150,
      percentage: (daily_totals.protein / 150) * 100
    },
    {
      name: 'Carbs',
      value: daily_totals.carbs,
      unit: 'g',
      icon: Wheat,
      iconColor: 'text-amber-500',
      iconBg: 'bg-gradient-to-br from-amber-100 to-yellow-100',
      progressGradient: 'from-amber-400 to-orange-500',
      target: 200,
      percentage: (daily_totals.carbs / 200) * 100
    },
    {
      name: 'Fats',
      value: daily_totals.fats,
      unit: 'g',
      icon: Droplet,
      iconColor: 'text-indigo-500',
      iconBg: 'bg-gradient-to-br from-indigo-100 to-purple-100',
      progressGradient: 'from-indigo-500 to-purple-500',
      target: 70,
      percentage: (daily_totals.fats / 70) * 100
    }
  ]

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mb-6">Today's Macros</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 content-start">
        {macros.map((macro) => {
          const Icon = macro.icon
          return (
            <div
              key={macro.name}
              className="p-5 rounded-xl bg-slate-800/50 backdrop-blur-md border border-white/10 hover:border-purple-500/30 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="text-purple-300" size={20} />
                  </div>
                  <span className="text-white text-sm font-medium">
                    {macro.name}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    {Math.round(macro.value)}
                  </span>
                  <span className="text-sm text-slate-400">
                    / {macro.target} {macro.unit}
                  </span>
                </div>

                {/* Progress Bar with Gradient */}
                <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full bg-gradient-to-r ${macro.progressGradient} transition-all duration-500`}
                    style={{ width: `${Math.min(macro.percentage, 100)}%` }}
                  />
                </div>

                <p className="text-xs text-slate-400">
                  {Math.round(macro.percentage)}% of target
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MacroSummary

