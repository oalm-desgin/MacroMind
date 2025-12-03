import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = ({ children, requireOnboarding = false }) => {
  const { user, loading, isGuest, hasCompletedOnboarding } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // Allow access if user is authenticated OR in guest mode
  if (!user && !isGuest) {
    console.log('[PROTECTED] No user, redirecting to /auth')
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  // If route requires onboarding completion, check it
  // Block ALL undefined/null/false states - only allow true
  if (requireOnboarding && !isGuest) {
    const completed = hasCompletedOnboarding()
    console.log('[PROTECTED] Checking onboarding requirement:', {
      requireOnboarding,
      isGuest,
      completed,
      has_completed_onboarding: user?.profile?.has_completed_onboarding
    })
    
    if (!completed) {
      console.log('[PROTECTED] Onboarding not completed, redirecting to /onboarding')
      return <Navigate to="/onboarding" replace state={{ from: location }} />
    }
  }

  console.log('[PROTECTED] Access granted')
  return children
}

export default ProtectedRoute
