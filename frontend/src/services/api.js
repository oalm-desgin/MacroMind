import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

// Create axios instance with environment-aware baseURL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle token expiration and auto-refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        
        if (refreshToken) {
          console.log('[API] Access token expired, attempting refresh...')
          
          // Call refresh token endpoint
          const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: refreshToken })
          })

          if (refreshResponse.ok) {
            const tokenData = await refreshResponse.json()
            
            // Update tokens in localStorage
            localStorage.setItem('access_token', tokenData.access_token)
            localStorage.setItem('refresh_token', tokenData.refresh_token)
            
            // Update Authorization header for retry
            originalRequest.headers.Authorization = `Bearer ${tokenData.access_token}`
            
            console.log('[API] Token refreshed successfully, retrying original request')
            
            // Retry the original request with new token
            return api(originalRequest)
          } else {
            throw new Error('Token refresh failed')
          }
        } else {
          throw new Error('No refresh token available')
        }
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError)
        // Refresh failed, logout user
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/auth'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

