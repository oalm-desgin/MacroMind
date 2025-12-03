import { API_BASE_URL } from '../utils/constants'
import api from './api'

// Simple fetch-based register with full error logging
const registerUser = async (payload) => {
  const API_URL = `${API_BASE_URL}/api/auth/register`
  console.log('Registering with URL:', API_URL)
  
  try {
    console.log('[AUTH_SERVICE] Registering with payload:', { ...payload, password: '***' })
    console.log('[AUTH_SERVICE] API_BASE_URL:', API_BASE_URL)
    console.log('[AUTH_SERVICE] Full URL:', API_URL)
    
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: 'include',  // REQUIRED: Works with allow_credentials=True in backend CORS
      body: JSON.stringify(payload)
    })

    console.log('[AUTH_SERVICE] Register response status:', res.status)
    console.log('[AUTH_SERVICE] Register response headers:', Object.fromEntries(res.headers.entries()))
    
    let data
    try {
      data = await res.json()
      console.log('[AUTH_SERVICE] Register response data:', data)
    } catch (jsonError) {
      console.error('[AUTH_SERVICE] Failed to parse JSON response:', jsonError)
      const text = await res.text()
      console.error('[AUTH_SERVICE] Raw response text:', text)
      throw new Error(`Invalid response from server (${res.status}): ${text.substring(0, 200)}`)
    }

    if (!res.ok) {
      console.error("REGISTER FAILED:", res.status, data)
      // Try to extract error message from standardized error response
      const errorMsg = data?.error || data?.message || data?.detail || `HTTP ${res.status}: Registration failed`
      throw new Error(errorMsg)
    }

    return data
  } catch (err) {
    console.error('FULL ERROR:', err)
    console.error('ERROR NAME:', err.name)
    console.error('ERROR MESSAGE:', err.message)
    console.error('ERROR STACK:', err.stack)
    
    // Try to extract response data if available
    if (err.response) {
      console.error('RESPONSE:', err.response)
      console.error('RESPONSE STATUS:', err.response.status)
      console.error('RESPONSE DATA:', err.response.data)
    }
    
    // For fetch errors, try to get response data
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.error("NETWORK ERROR: Check if backend is running and CORS is configured")
    }
    
    throw err
  }
}

// Simple fetch-based login with full error logging
const loginUser = async (payload) => {
  try {
    console.log('[AUTH_SERVICE] Logging in with payload:', { ...payload, password: '***' })
    console.log('[AUTH_SERVICE] API_BASE_URL:', API_BASE_URL)
    console.log('[AUTH_SERVICE] Full URL:', `${API_BASE_URL}/api/auth/login`)
    
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: 'include',  // REQUIRED: Works with allow_credentials=True in backend CORS
      body: JSON.stringify(payload)
    })

    console.log('[AUTH_SERVICE] Login response status:', res.status)
    console.log('[AUTH_SERVICE] Login response headers:', Object.fromEntries(res.headers.entries()))
    
    const data = await res.json()
    console.log('[AUTH_SERVICE] Login response data:', data)

    if (!res.ok) {
      console.error("LOGIN FAILED:", res.status, data)
      throw new Error(data?.detail || data?.message || "Login failed")
    }

    return data
  } catch (err) {
    console.error("LOGIN ERROR:", err)
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.error("NETWORK ERROR: Check if backend is running and CORS is configured")
    }
    throw err
  }
}

// Wrapper functions that maintain compatibility with existing code
const authService = {
  /**
   * Register a new user and automatically log in
   * Only email and password are required now
   */
  register: async (email, password, fullName = null) => {
    const payload = {
      email,
      password
    }
    
    // Add full_name only if provided
    if (fullName) {
      payload.full_name = fullName
    }
    
    const response = await registerUser(payload)
    
    // Backend returns tokens directly
    const { access_token, refresh_token } = response
    
    // Store tokens
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    
    // Fetch user profile using axios (since it handles auth tokens)
    const user = await authService.getProfile()
    localStorage.setItem('user', JSON.stringify(user))
    
    return user
  },

  /**
   * Login user and store tokens
   */
  login: async (email, password) => {
    const response = await loginUser({
      email,
      password
    })
    
    const { access_token, refresh_token } = response
    
    // Store tokens
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    
    // Fetch user profile using axios (since it handles auth tokens)
    const user = await authService.getProfile()
    localStorage.setItem('user', JSON.stringify(user))
    
    return user
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/api/auth/profile', {
      fitness_goal: profileData.fitnessGoal,
      dietary_preference: profileData.dietaryPreference,
      daily_calories: profileData.dailyCalories
    })
    return response.data
  },

  /**
   * Submit onboarding data
   * Returns updated user profile with has_completed_onboarding = true
   */
  submitOnboarding: async (onboardingData) => {
    const response = await api.post('/api/auth/onboarding', onboardingData)
    // Backend now returns UserResponse with updated profile
    return response.data
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token')
  },

  /**
   * Get stored user data
   */
  getStoredUser: () => {
    const userJson = localStorage.getItem('user')
    return userJson ? JSON.parse(userJson) : null
  }
}

export default authService
