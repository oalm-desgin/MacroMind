import { Calendar, MessageCircle, Utensils, Target } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const QuickActions = () => {
  const { isGuest } = useAuth()

  const handleGenerateClick = () => {
    console.log('HARD NAV FIRED: handleGenerateClick')
    if (isGuest) {
      console.log('HARD NAV FIRED: Guest user - redirecting to auth')
      window.location.href = '/auth'
      return
    }
    console.log('HARD NAV FIRED: Navigating to /meal-planner')
    window.location.href = '/meal-planner'
  }

  const handleGoalClick = () => {
    console.log('HARD NAV FIRED: handleGoalClick')
    if (isGuest) {
      console.log('HARD NAV FIRED: Guest user - redirecting to auth')
      window.location.href = '/auth'
      return
    }
    console.log('HARD NAV FIRED: Navigating to /settings')
    window.location.href = '/settings'
  }

  const handleCoachClick = () => {
    console.log('HARD NAV FIRED: Chat With AI Coach')
    window.location.href = '/ai-coach'
  }

  const handlePlannerClick = () => {
    console.log('HARD NAV FIRED: Open Meal Planner')
    if (isGuest) {
      console.log('HARD NAV FIRED: Guest user - redirecting to auth')
      window.location.href = '/auth'
      return
    }
    window.location.href = '/meal-planner'
  }

  const actions = [
    {
      id: 'generate',
      label: 'Generate Weekly Plan',
      subtitle: 'Create your personalized meal plan',
      icon: Calendar,
      onClick: handleGenerateClick,
      requiresAuth: true,
      iconColor: 'bg-[#2563EB]/10',
      iconTextColor: 'text-[#2563EB]'
    },
    {
      id: 'coach',
      label: 'Chat With AI Coach',
      subtitle: 'Get personalized nutrition advice',
      icon: MessageCircle,
      onClick: handleCoachClick,
      requiresAuth: false,
      iconColor: 'bg-[#22C55E]/10',
      iconTextColor: 'text-[#22C55E]'
    },
    {
      id: 'planner',
      label: 'Open Meal Planner',
      subtitle: 'View and manage your meals',
      icon: Utensils,
      onClick: handlePlannerClick,
      requiresAuth: true,
      iconColor: 'bg-[#F97316]/10',
      iconTextColor: 'text-[#F97316]'
    },
    {
      id: 'goal',
      label: 'Update Fitness Goal',
      subtitle: 'Adjust your nutrition targets',
      icon: Target,
      onClick: handleGoalClick,
      requiresAuth: true,
      iconColor: 'bg-[#2563EB]/10',
      iconTextColor: 'text-[#2563EB]'
    }
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          const needsAuth = isGuest && action.requiresAuth
          const isLocked = needsAuth

          return (
            <button
              key={action.id}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log(`HARD NAV FIRED: ${action.label}`)
                console.log('Action ID:', action.id)
                console.log('Current URL:', window.location.href)
                
                if (isLocked) {
                  console.log('HARD NAV FIRED: Action locked, redirecting to auth')
                  window.location.href = '/auth'
                  return
                }
                
                if (action.onClick) {
                  // All actions now use onClick with window.location.href
                  action.onClick()
                } else {
                  console.log('HARD NAV FIRED: No action handler found')
                }
              }}
              disabled={isLocked}
              className={`group relative bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all duration-300 text-left w-full ${
                isLocked
                  ? 'opacity-40 cursor-not-allowed'
                  : 'cursor-pointer hover:scale-105 hover:shadow-xl hover:border-purple-500/30 hover:bg-slate-800/50 active:scale-95'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-2`}
            >
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl z-10">
                  <div className="bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-white/10">
                    <p className="text-xs font-medium text-gray-300">Register to unlock</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 transition-all duration-300 ${!isLocked ? 'group-hover:scale-110 group-hover:shadow-md' : ''}`}>
                  <Icon className="text-purple-300" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold mb-0.5 transition-colors duration-300 ${
                    isLocked ? 'text-gray-500' : 'text-white group-hover:text-purple-300'
                  }`}>
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-400">{action.subtitle}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActions

