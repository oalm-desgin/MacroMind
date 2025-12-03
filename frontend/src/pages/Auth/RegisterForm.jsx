import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, Check, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ToastContainer'
import authService from '../../services/authService'

const RegisterForm = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  })

  const validatePassword = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    }
  }

  const getPasswordStrengthScore = () => {
    const checks = Object.values(passwordStrength)
    const passed = checks.filter(Boolean).length
    return passed
  }

  const getPasswordStrengthLabel = () => {
    const score = getPasswordStrengthScore()
    if (score === 0) return { label: 'Weak', color: 'text-red-500', bg: 'bg-red-500' }
    if (score === 1) return { label: 'Weak', color: 'text-red-500', bg: 'bg-red-500' }
    if (score === 2) return { label: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500' }
    if (score === 3) return { label: 'Good', color: 'text-blue-500', bg: 'bg-blue-500' }
    return { label: 'Strong', color: 'text-emerald-500', bg: 'bg-emerald-500' }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      showToast('Passwords do not match', 'error')
      return
    }

    // Validate password strength
    const isValid = Object.values(passwordStrength).every(v => v)
    if (!isValid) {
      setError('Password does not meet requirements')
      showToast('Password does not meet all requirements', 'error')
      return
    }

    setLoading(true)

    try {
      console.log('[REGISTER] Starting registration process...')
      // Only send email and password - fitness data will be collected during onboarding
      const user = await register(
        formData.email,
        formData.password
      )
      console.log('[REGISTER] Registration successful, user profile:', {
        has_completed_onboarding: user?.profile?.has_completed_onboarding,
        profile_exists: !!user?.profile
      })
      
      showToast('Account created successfully! Welcome to MacroMind!', 'success')
      
      // CRITICAL: Fetch FRESH profile from API to ensure we have latest onboarding status
      console.log('[REGISTER] Fetching fresh profile to verify onboarding status...')
      const freshProfile = await authService.getProfile()
      const onboardingComplete = freshProfile?.profile?.has_completed_onboarding === true
      
      console.log('[REGISTER] Onboarding status:', {
        onboardingComplete,
        value: freshProfile?.profile?.has_completed_onboarding
      })
      
      // Deterministic routing - new users should have has_completed_onboarding = false
      if (onboardingComplete) {
        console.log('[REGISTER] Redirecting to /dashboard')
        navigate('/dashboard', { replace: true })
      } else {
        console.log('[REGISTER] Redirecting to /onboarding')
        navigate('/onboarding', { replace: true })
      }
    } catch (err) {
      console.error('[REGISTER] Registration failed:', err)
      console.error('[REGISTER] Error details:', {
        name: err.name,
        message: err.message,
        response: err.response,
        responseData: err.response?.data
      })
      
      // Extract the actual error message from various possible locations
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          err?.response?.data?.detail || 
                          err?.message || 
                          `Registration failed: ${err.message || 'Unknown error'}`
      
      console.error('[REGISTER] Displaying error message:', errorMessage)
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    setFormData({
      ...formData,
      [name]: value
    })

    // Check password strength
    if (name === 'password') {
      setPasswordStrength(validatePassword(value))
    }

    // Clear error when user starts typing
    if (error) setError('')
  }

  const PasswordRequirement = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${met ? 'opacity-100' : 'opacity-60'}`}>
      {met ? (
        <Check className="text-emerald-500 flex-shrink-0" size={16} />
      ) : (
        <X className="text-slate-400 flex-shrink-0" size={16} />
      )}
      <span className={met ? 'text-emerald-300 font-medium' : 'text-gray-400'}>{text}</span>
    </div>
  )

  const strengthInfo = getPasswordStrengthLabel()
  const strengthScore = getPasswordStrengthScore()

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-semibold text-white">
            Password
          </label>
          {formData.password && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${strengthInfo.color}`}>
                {strengthInfo.label}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                      i <= strengthScore
                        ? strengthInfo.bg
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
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
            placeholder="Create a strong password"
            disabled={loading}
            aria-label="Password"
          />
        </div>
        {/* Password Requirements */}
        {formData.password && (
          <div className="mt-3 p-3 bg-slate-900/40 backdrop-blur-sm rounded-xl space-y-2 animate-slide-up border border-white/10">
            <PasswordRequirement met={passwordStrength.length} text="At least 8 characters" />
            <PasswordRequirement met={passwordStrength.uppercase} text="One uppercase letter" />
            <PasswordRequirement met={passwordStrength.lowercase} text="One lowercase letter" />
            <PasswordRequirement met={passwordStrength.number} text="One number" />
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white">
          Confirm Password
        </label>
        <div className="relative group">
          <Lock 
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
              focusedField === 'confirmPassword' 
                ? 'text-purple-400 scale-110' 
                : 'text-gray-400 group-hover:text-gray-300'
            }`} 
            size={20} 
          />
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => setFocusedField(null)}
            required
            className={`w-full bg-white/10 backdrop-blur-md border rounded-xl px-4 pl-12 py-3.5 text-white placeholder-gray-400 focus:ring-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                : formData.confirmPassword && formData.password === formData.confirmPassword
                ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500'
                : 'border-white/20 focus:border-purple-500 focus:ring-purple-500'
            }`}
            placeholder="Confirm your password"
            disabled={loading}
            aria-label="Confirm password"
          />
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <Check className="absolute right-4 top-1/2 transform -translate-y-1/2 text-emerald-500" size={20} />
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:scale-100 mt-6 relative overflow-hidden group"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <Check size={18} className="group-hover:scale-110 transition-transform duration-300" />
            </>
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
    </form>
  )
}

export default RegisterForm
