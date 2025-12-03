import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ToastContainer'
import authService from '../../services/authService'

const LoginForm = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('[LOGIN] Starting login process...')
      const user = await login(formData.email, formData.password)
      console.log('[LOGIN] Login successful, user profile:', {
        has_completed_onboarding: user?.profile?.has_completed_onboarding,
        profile_exists: !!user?.profile
      })
      
      showToast('Welcome back!', 'success')
      
      // CRITICAL: Fetch FRESH profile from API to ensure we have latest onboarding status
      console.log('[LOGIN] Fetching fresh profile to verify onboarding status...')
      const freshProfile = await authService.getProfile()
      const onboardingComplete = freshProfile?.profile?.has_completed_onboarding === true
      
      console.log('[LOGIN] Onboarding status:', {
        onboardingComplete,
        value: freshProfile?.profile?.has_completed_onboarding
      })
      
      // Deterministic routing - no timeouts, no assumptions
      if (onboardingComplete) {
        console.log('[LOGIN] Redirecting to /dashboard')
        navigate('/dashboard', { replace: true })
      } else {
        console.log('[LOGIN] Redirecting to /onboarding')
        navigate('/onboarding', { replace: true })
      }
    } catch (err) {
      console.error('[LOGIN] Login failed:', err)
      const errorMessage = err.response?.data?.detail || 'Invalid email or password'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up shadow-sm">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-200 text-sm font-medium flex-1">{error}</p>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-semibold text-white">
          Email Address
        </label>
        <div className="relative group">
          <Mail 
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
              focusedField === 'email' 
                ? 'text-purple-400 scale-110' 
                : 'text-gray-400 group-hover:text-gray-300'
            }`} 
            size={20} 
          />
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            required
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 pl-12 py-3.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="you@example.com"
            disabled={loading}
            aria-label="Email address"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold text-white">
          Password
        </label>
        <div className="relative group">
          <Lock 
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
              focusedField === 'password' 
                ? 'text-purple-400 scale-110' 
                : 'text-gray-400 group-hover:text-gray-300'
            }`} 
            size={20} 
          />
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            required
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 pl-12 py-3.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter your password"
            disabled={loading}
            aria-label="Password"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:scale-100 mt-8 relative overflow-hidden group"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <Lock size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </>
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
    </form>
  )
}

export default LoginForm
