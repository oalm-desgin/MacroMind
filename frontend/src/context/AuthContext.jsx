import { createContext, useState, useEffect } from 'react'
import authService from '../services/authService'

export const AuthContext = createContext()

// Guest user object
const createGuestUser = () => ({
  id: 'guest',
  email: 'guest@macromind.local',
  isGuest: true,
  profile: {
    fitness_goal: 'maintain',
    dietary_preference: 'none',
    daily_calories: 2200
  }
})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  // Fetch user profile from API - this is the source of truth
  const fetchUserProfileFromAPI = async () => {
    try {
      console.log('[AUTH] Fetching fresh profile from API...')
      const profile = await authService.getProfile()
      console.log('[AUTH] Profile fetched:', {
        has_completed_onboarding: profile?.profile?.has_completed_onboarding,
        profile_exists: !!profile?.profile
      })
      
      setUser(profile)
      setIsGuest(false)
      // Save to localStorage ONLY after successful API fetch
      localStorage.setItem('user', JSON.stringify(profile))
      return profile
    } catch (error) {
      console.error('[AUTH] Failed to fetch profile:', error)
      throw error
    }
  }

  // Check for stored user or guest mode on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for guest mode first
        const guestMode = localStorage.getItem('guest_mode') === 'true'
        
        if (guestMode) {
          console.log('[AUTH] Guest mode detected')
          setUser(createGuestUser())
          setIsGuest(true)
          setLoading(false)
          return
        }

        // Check for authenticated user - ALWAYS fetch fresh from API
        if (authService.isAuthenticated()) {
          console.log('[AUTH] User authenticated, fetching fresh profile...')
          await fetchUserProfileFromAPI()
        } else {
          console.log('[AUTH] No authentication token found')
        }
      } catch (error) {
        console.error('[AUTH] Failed to initialize auth:', error)
        // Clear invalid tokens
        await authService.logout()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    console.log('[AUTH] Login initiated for:', email)
    // Clear guest mode on login
    localStorage.removeItem('guest_mode')
    setIsGuest(false)
    
    // Login and get tokens
    await authService.login(email, password)
    
    // CRITICAL: Fetch fresh profile from API after login
    const user = await fetchUserProfileFromAPI()
    console.log('[AUTH] Login complete, onboarding status:', user?.profile?.has_completed_onboarding)
    
    return user
  }

  const register = async (email, password) => {
    console.log('[AUTH] Registration initiated for:', email)
    // Clear guest mode on registration
    localStorage.removeItem('guest_mode')
    setIsGuest(false)
    
    try {
      // Register and get tokens
      // Only email and password required - fitness data collected during onboarding
      await authService.register(email, password)
      
      // CRITICAL: Fetch fresh profile from API after registration
      const user = await fetchUserProfileFromAPI()
      console.log('[AUTH] Registration complete, onboarding status:', user?.profile?.has_completed_onboarding)
      
      return user
    } catch (error) {
      console.error('[AUTH] Registration error in AuthContext:', error)
      // Re-throw with actual error message for UI to display
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.response?.data?.detail || 
                          error?.message || 
                          'Registration failed'
      throw new Error(errorMessage)
    }
  }

  const loginAsGuest = () => {
    const guestUser = createGuestUser()
    localStorage.setItem('guest_mode', 'true')
    setUser(guestUser)
    setIsGuest(true)
    return guestUser
  }

  const logout = async () => {
    // Clear guest mode
    localStorage.removeItem('guest_mode')
    setIsGuest(false)
    
    // Only call auth service logout if actually authenticated
    if (!isGuest && authService.isAuthenticated()) {
      await authService.logout()
    }
    
    setUser(null)
  }

  const updateUserProfile = async (profileData) => {
    // Guest users can't update profile
    if (isGuest) {
      throw new Error('Guest users cannot update profile. Please register to save your preferences.')
    }
    
    await authService.updateProfile(profileData)
    // Refresh user data from API
    return await fetchUserProfileFromAPI()
  }

  // Helper function to check if onboarding is completed
  // Returns false for: undefined, null, false, or missing profile
  const hasCompletedOnboarding = () => {
    if (isGuest) {
      console.log('[AUTH] hasCompletedOnboarding: false (guest user)')
      return false
    }
    if (!user || !user.profile) {
      console.log('[AUTH] hasCompletedOnboarding: false (no user or profile)')
      return false
    }
    const completed = user.profile.has_completed_onboarding === true
    console.log('[AUTH] hasCompletedOnboarding:', completed, 'value:', user.profile.has_completed_onboarding)
    return completed
  }

  // Refresh user profile from API (useful after onboarding completion)
  const refreshUserProfile = async () => {
    if (isGuest || !authService.isAuthenticated()) {
      console.log('[AUTH] refreshUserProfile: skipped (guest or not authenticated)')
      return null
    }
    
    try {
      console.log('[AUTH] Refreshing user profile from API...')
      const updatedUser = await fetchUserProfileFromAPI()
      console.log('[AUTH] Profile refreshed, onboarding status:', updatedUser?.profile?.has_completed_onboarding)
      return updatedUser
    } catch (error) {
      console.error('[AUTH] Failed to refresh user profile:', error)
      return null
    }
  }

  const value = {
    user,
    loading,
    isGuest,
    login,
    register,
    loginAsGuest,
    logout,
    updateUserProfile,
    refreshUserProfile,
    hasCompletedOnboarding,
    isAuthenticated: !!user || isGuest
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
