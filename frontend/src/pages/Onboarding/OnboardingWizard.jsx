import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Target, 
  Dumbbell, 
  Heart, 
  Brain, 
  TrendingUp, 
  Home, 
  Activity, 
  Flower2, 
  Weight, 
  Waves, 
  Bike, 
  Music, 
  Zap, 
  X, 
  Footprints, 
  Check, 
  Ruler, 
  Scale,
  User
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/ToastContainer'
import authService from '../../services/authService'

// StepContainer component with game-like spring animations
const StepContainer = ({ children, stepKey }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Bento Grid Choice Card with "Equipped" indicator - Dark Futuristic
const ChoiceCard = ({ icon: Icon, label, isSelected, onClick, className = "" }) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 group
        ${isSelected 
          ? 'bg-indigo-600/20 border-2 border-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.02]' 
          : 'bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10'
        }
        ${className}
      `}
    >
      {/* Equipped Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50 z-10"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}
      <div className="flex flex-col items-center justify-center gap-3">
        {Icon && (
          <motion.div 
            animate={isSelected ? { rotate: [0, -10, 10, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className={`p-3 rounded-xl ${isSelected ? 'bg-indigo-500/20' : 'bg-slate-700/50'}`}
          >
            <Icon className={`w-8 h-8 ${isSelected ? 'text-indigo-300' : 'text-slate-400 group-hover:text-indigo-400'}`} />
          </motion.div>
        )}
        <span className={`text-base font-semibold text-center ${isSelected ? 'text-indigo-200' : 'text-white'}`}>
          {label}
        </span>
      </div>
    </motion.button>
  )
}

// Visual Slider Component - Dark Theme
const VisualSlider = ({ label, value, onChange, min = 1, max = 10, colorFrom = "red", colorTo = "green" }) => {
  const percentage = ((value - min) / (max - min)) * 100
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-lg font-bold text-white">{label}</label>
        <span className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
          {value}/{max}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-4 bg-slate-800 rounded-full appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, 
              ${colorFrom} 0%, 
              ${colorFrom} ${percentage}%, 
              ${colorTo} ${percentage}%, 
              ${colorTo} 100%)`
          }}
        />
        <div className="flex justify-between text-sm text-slate-400 mt-2">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  )
}

// Mental State Messages Mapping
const MENTAL_STATE_MESSAGES = {
  'Calm': "It's okay. We'll focus on maintaining your peace.",
  'Stressed': "It's okay. We'll build a plan to help you find some calm.",
  'Anxious': "You're not alone. We'll help you find calm and build confidence.",
  'Burned out': "Rest is important. We'll prioritize recovery and sustainable progress.",
  'Motivated': "Let's channel this energy into action! We'll keep you on track."
}

// Mental State Card Component - Therapeutic with Emoji
const MentalStateCard = ({ emoji, label, isSelected, onClick, color }) => {
  const colorClasses = {
    'Calm': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    'Stressed': 'bg-red-500/20 text-red-300 border-red-500/50',
    'Anxious': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    'Burned out': 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    'Motivated': 'bg-green-500/20 text-green-300 border-green-500/50'
  }
  
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={isSelected ? { scale: [1, 1.05, 1.02] } : {}}
      transition={{ duration: 0.3 }}
      className={`
        relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3
        ${colorClasses[color] || 'bg-slate-800/40 text-white border-slate-700'}
        ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-indigo-500 border-indigo-500 shadow-xl shadow-indigo-500/20' : ''}
      `}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50 z-10"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}
      <span className="text-4xl">{emoji}</span>
      <span className="font-semibold text-base">{label}</span>
    </motion.button>
  )
}

const OnboardingWizard = () => {
  const navigate = useNavigate()
  const { user, refreshUserProfile, hasCompletedOnboarding } = useAuth()
  const { showToast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Redirect if already completed onboarding
  useEffect(() => {
    console.log('[ONBOARDING] Checking if onboarding already completed...')
    if (hasCompletedOnboarding()) {
      console.log('[ONBOARDING] Already completed, redirecting to dashboard')
      navigate('/dashboard', { replace: true })
    } else {
      console.log('[ONBOARDING] Not completed, showing wizard')
    }
  }, [user, navigate, hasCompletedOnboarding])

  const [formData, setFormData] = useState({
    // Step 1
    main_goal: '',
    seriousness_score: 5,
    // Step 2
    current_weight: '',
    goal_weight: '',
    height: '',
    age_range: '',
    // Step 3
    dietary_preference: 'None',
    disliked_foods: '',
    meals_per_day: 3,
    snacking_frequency: 'Sometimes',
    // Step 4
    activity_level: 'Moderate',
    preferred_workout_location: 'Home',
    enjoyed_movement_types: [],
    // Step 5
    current_mental_state: 'Calm',
    biggest_struggle: '',
    sleep_quality: 'Good',
    // Step 6
    motivation_text: '',
    fear_text: '',
    // Step 7
    plan_strictness: 'Balanced',
    reminder_frequency: 'Once a day',
    motivation_tone: 'Supportive',
    // Step 8
    commitment_ready: 'Yes',
    commitment_score: 7
  })

  const totalSteps = 9

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      console.log('[ONBOARDING] Submitting onboarding data...')
      console.log('[ONBOARDING] Raw form data:', formData)
      
      // Helper function to convert string to float, stripping units
      const toFloat = (value) => {
        if (!value) return null
        const cleaned = String(value).replace(/[^0-9.]/g, '')
        const num = parseFloat(cleaned)
        return isNaN(num) ? null : num
      }
      
      // Helper function to convert string to integer
      const toInt = (value) => {
        if (!value) return null
        const cleaned = String(value).replace(/[^0-9]/g, '')
        const num = parseInt(cleaned, 10)
        return isNaN(num) ? null : num
      }
      
      // Clean and format data before submission
      const submitData = {
        // Step 1
        main_goal: formData.main_goal || null,
        seriousness_score: formData.seriousness_score ? parseInt(formData.seriousness_score, 10) : null,
        
        // Step 2 - Convert to proper types (Numbers)
        current_weight: formData.current_weight ? Number(toFloat(formData.current_weight)) : null,
        goal_weight: formData.goal_weight ? Number(toFloat(formData.goal_weight)) : null,
        height: formData.height ? Number(toFloat(formData.height)) : null,
        age_range: formData.age_range || null,            // String, ensure exact match
        
        // Step 3 - Convert dietary preference to lowercase enum format
        // Backend expects: "none", "halal", "vegan", "vegetarian"
        dietary_preference: (() => {
          const pref = formData.dietary_preference || 'None'
          const mapping = {
            'None': 'none',
            'Halal': 'halal',
            'Vegan': 'vegan',
            'Vegetarian': 'vegetarian',
            'Gluten Free': 'none',  // Not in enum, default to none
            'Dairy Free': 'none'     // Not in enum, default to none
          }
          return mapping[pref] || 'none'
        })(),
        disliked_foods: formData.disliked_foods || null,
        meals_per_day: formData.meals_per_day ? parseInt(formData.meals_per_day, 10) : null,
        snacking_frequency: formData.snacking_frequency || null,
        
        // Step 4 - Activity level is a string (not enum)
        activity_level: formData.activity_level || null,
        preferred_workout_location: formData.preferred_workout_location || null,
        enjoyed_movement_types: Array.isArray(formData.enjoyed_movement_types) 
          ? formData.enjoyed_movement_types.join(', ') 
          : formData.enjoyed_movement_types || null,
        
        // Step 5
        current_mental_state: formData.current_mental_state || null,
        biggest_struggle: formData.biggest_struggle || null,
        sleep_quality: formData.sleep_quality || null,
        
        // Step 6
        motivation_text: formData.motivation_text || null,
        fear_text: formData.fear_text || null,
        
        // Step 7
        plan_strictness: formData.plan_strictness || null,
        reminder_frequency: formData.reminder_frequency || null,
        motivation_tone: formData.motivation_tone || null,
        
        // Step 8
        commitment_ready: formData.commitment_ready || null,
        commitment_score: formData.commitment_score ? parseInt(formData.commitment_score, 10) : null,
        
        // Additional fields that might be needed
        daily_calories: null,  // Send null if empty (not collected in onboarding)
        fitness_goal: null     // Not collected in onboarding, backend will use default
      }

      // Log the cleaned payload for verification
      console.log('[ONBOARDING] Cleaned payload before submission:', submitData)
      console.log('[ONBOARDING] Data types check:', {
        current_weight: typeof submitData.current_weight,
        goal_weight: typeof submitData.goal_weight,
        height: typeof submitData.height,
        age_range: typeof submitData.age_range,
        dietary_preference: submitData.dietary_preference,
        seriousness_score: typeof submitData.seriousness_score,
        commitment_score: typeof submitData.commitment_score,
        meals_per_day: typeof submitData.meals_per_day
      })

      // STEP 1: Save onboarding data to API
      const updatedUser = await authService.submitOnboarding(submitData)
      console.log('[ONBOARDING] Onboarding data saved to API, received updated profile')
      
      if (!updatedUser) {
        throw new Error('Failed to save onboarding data')
      }
      
      // STEP 2: Verify state is updated
      const onboardingComplete = updatedUser?.profile?.has_completed_onboarding === true
      console.log('[ONBOARDING] Onboarding status:', {
        onboardingComplete,
        value: updatedUser?.profile?.has_completed_onboarding
      })
      
      if (!onboardingComplete) {
        throw new Error('Onboarding status not updated correctly')
      }
      
      // STEP 3: Update auth context with new profile
      await refreshUserProfile()
      
      // STEP 4: Only navigate after verification
      showToast('Welcome to your journey!', 'success')
      console.log('[ONBOARDING] Onboarding complete, navigating to dashboard')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('[ONBOARDING] Onboarding error:', error)
      showToast('Failed to save onboarding data. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.main_goal !== ''
      case 2:
        return formData.current_weight && formData.goal_weight && formData.height && formData.age_range
      case 3:
        return formData.dietary_preference !== ''
      case 4:
        return formData.activity_level !== ''
      case 5:
        return formData.current_mental_state !== '' && formData.biggest_struggle !== ''
      case 6:
        return formData.motivation_text.trim() !== ''
      case 7:
        return formData.plan_strictness !== '' && formData.reminder_frequency !== '' && formData.motivation_tone !== ''
      case 8:
        return formData.commitment_ready !== ''
      case 9:
        return true
      default:
        return false
    }
  }

  // Goal icons mapping
  const goalIcons = {
    'Lose Weight': Target,
    'Gain Muscle': Dumbbell,
    'Improve Mental Health': Heart,
    'Build Discipline': Brain,
    'Just Exploring': TrendingUp
  }

  // Activity icons mapping
  const activityIcons = {
    'Home': Home,
    'Gym': Dumbbell,
    'Outdoors': Activity,
    'None': X
  }

  // Movement type icons
  const movementIcons = {
    'Running': Activity,
    'Walking': Footprints,
    'Yoga': Flower2,
    'Weightlifting': Weight,
    'Swimming': Waves,
    'Cycling': Bike,
    'Dancing': Music,
    'HIIT': Zap
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepContainer stepKey={1}>
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 text-transparent mb-2">
                  What is your main goal?
                </h2>
                <p className="text-white text-lg">Let's start by understanding what you want to achieve</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Lose Weight', 'Gain Muscle', 'Improve Mental Health', 'Build Discipline', 'Just Exploring'].map(goal => {
                  const Icon = goalIcons[goal]
                  return (
                    <ChoiceCard
                      key={goal}
                      icon={Icon}
                      label={goal}
                      isSelected={formData.main_goal === goal}
                      onClick={() => handleChange('main_goal', goal)}
                    />
                  )
                })}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-700">
                <VisualSlider
                  label="How serious are you?"
                  value={formData.seriousness_score}
                  onChange={(value) => handleChange('seriousness_score', value)}
                  min={1}
                  max={10}
                  colorFrom="#ef4444"
                  colorTo="#10b981"
                />
              </div>
            </div>
          </StepContainer>
        )

      case 2:
        return (
          <StepContainer stepKey={2}>
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 text-transparent mb-2">
                  Body Basics
                </h2>
                <p className="text-white text-lg">Help us understand your starting point</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Form Fields */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white">Current Weight (lbs)</label>
                      <input
                        type="number"
                        value={formData.current_weight}
                        onChange={(e) => handleChange('current_weight', e.target.value)}
                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl px-5 py-5 text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-gray-400"
                        placeholder="e.g., 180"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white">Goal Weight (lbs)</label>
                      <input
                        type="number"
                        value={formData.goal_weight}
                        onChange={(e) => handleChange('goal_weight', e.target.value)}
                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl px-5 py-5 text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-gray-400"
                        placeholder="e.g., 160"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white">Height (inches)</label>
                      <input
                        type="number"
                        value={formData.height}
                        onChange={(e) => handleChange('height', e.target.value)}
                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl px-5 py-5 text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-gray-400"
                        placeholder="e.g., 70"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white">Age Range</label>
                      <select
                        value={formData.age_range}
                        onChange={(e) => handleChange('age_range', e.target.value)}
                        className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl px-5 py-5 text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      >
                        <option value="" className="bg-slate-900 text-white">Select age range</option>
                        <option value="18-25" className="bg-slate-900 text-white">18-25</option>
                        <option value="26-35" className="bg-slate-900 text-white">26-35</option>
                        <option value="36-45" className="bg-slate-900 text-white">36-45</option>
                        <option value="46-55" className="bg-slate-900 text-white">46-55</option>
                        <option value="56-65" className="bg-slate-900 text-white">56-65</option>
                        <option value="65+" className="bg-slate-900 text-white">65+</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Right: Large Stylized Body Outline Icon */}
                <div className="lg:col-span-1 flex items-center justify-center">
                  <div className="relative w-full max-w-sm">
                    {/* Enhanced Body Outline Diagram */}
                    <div className="relative backdrop-blur-xl bg-slate-900/40 border border-white/10 rounded-3xl p-10 shadow-2xl">
                      <div className="flex flex-col items-center gap-8">
                        {/* Head - Larger and more stylized */}
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.05, 1],
                            boxShadow: [
                              "0 0 20px rgba(168, 85, 247, 0.3)",
                              "0 0 30px rgba(168, 85, 247, 0.5)",
                              "0 0 20px rgba(168, 85, 247, 0.3)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-24 h-24 rounded-full border-4 border-purple-400/60 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shadow-lg shadow-purple-500/30"
                        >
                          <User className="w-12 h-12 text-purple-300" />
                        </motion.div>
                        
                        {/* Body with enhanced styling */}
                        <div className="flex items-center gap-10">
                          <div className="flex flex-col items-center gap-3">
                            <motion.div 
                              whileHover={{ scale: 1.1 }}
                              className="p-5 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border-2 border-purple-400/50 shadow-lg"
                            >
                              <Scale className="w-12 h-12 text-purple-200" />
                            </motion.div>
                            <span className="text-sm text-white font-semibold bg-slate-800/50 px-3 py-1 rounded-full">Weight</span>
                          </div>
                          
                          <motion.div 
                            animate={{ 
                              borderColor: ["rgba(168, 85, 247, 0.5)", "rgba(236, 72, 153, 0.5)", "rgba(168, 85, 247, 0.5)"]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="w-20 h-32 rounded-xl border-4 bg-gradient-to-b from-purple-500/10 via-pink-500/10 to-purple-500/10 shadow-inner"
                          ></motion.div>
                          
                          <div className="flex flex-col items-center gap-3">
                            <motion.div 
                              whileHover={{ scale: 1.1 }}
                              className="p-5 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 border-2 border-pink-400/50 shadow-lg"
                            >
                              <Ruler className="w-12 h-12 text-pink-200" />
                            </motion.div>
                            <span className="text-sm text-white font-semibold bg-slate-800/50 px-3 py-1 rounded-full">Height</span>
                          </div>
                        </div>
                        
                        {/* Legs - Enhanced */}
                        <div className="flex gap-6">
                          <motion.div 
                            whileHover={{ scaleY: 1.1 }}
                            className="w-8 h-20 rounded-lg border-2 border-purple-400/40 bg-gradient-to-b from-purple-500/15 to-transparent shadow-md"
                          ></motion.div>
                          <motion.div 
                            whileHover={{ scaleY: 1.1 }}
                            className="w-8 h-20 rounded-lg border-2 border-purple-400/40 bg-gradient-to-b from-purple-500/15 to-transparent shadow-md"
                          ></motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StepContainer>
        )

      case 3:
        return (
          <StepContainer stepKey={3}>
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 text-transparent mb-2">
                  Diet Preferences
                </h2>
                <p className="text-white text-lg">Tell us about your eating habits</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Dietary Restrictions</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['None', 'Halal', 'Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free'].map(restriction => (
                      <ChoiceCard
                        key={restriction}
                        label={restriction}
                        isSelected={formData.dietary_preference === restriction}
                        onClick={() => handleChange('dietary_preference', restriction)}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Foods you dislike (optional)</label>
                  <input
                    type="text"
                    value={formData.disliked_foods}
                    onChange={(e) => handleChange('disliked_foods', e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl px-5 py-5 text-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                    placeholder="e.g., broccoli, fish, spicy food"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Meals per day</label>
                    <select
                      value={formData.meals_per_day}
                      onChange={(e) => handleChange('meals_per_day', parseInt(e.target.value))}
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl px-5 py-5 text-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value={1}>1 meal</option>
                      <option value={2}>2 meals</option>
                      <option value={3}>3 meals</option>
                      <option value={4}>4+ meals</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Snacking frequency</label>
                    <select
                      value={formData.snacking_frequency}
                      onChange={(e) => handleChange('snacking_frequency', e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl px-5 py-5 text-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value="Never">Never</option>
                      <option value="Rarely">Rarely</option>
                      <option value="Sometimes">Sometimes</option>
                      <option value="Often">Often</option>
                      <option value="Always">Always</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </StepContainer>
        )

      case 4:
        return (
          <StepContainer stepKey={4}>
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 text-transparent mb-2">
                  Activity Level
                </h2>
                <p className="text-white text-lg">How active are you?</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Activity Level</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Sedentary', 'Light', 'Moderate', 'Very Active'].map(level => (
                      <ChoiceCard
                        key={level}
                        label={level}
                        isSelected={formData.activity_level === level}
                        onClick={() => handleChange('activity_level', level)}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Preferred Workout Location</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Home', 'Gym', 'Outdoors', 'None'].map(location => {
                      const Icon = activityIcons[location] || Home
                      return (
                        <ChoiceCard
                          key={location}
                          icon={Icon}
                          label={location}
                          isSelected={formData.preferred_workout_location === location}
                          onClick={() => handleChange('preferred_workout_location', location)}
                        />
                      )
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Movement types you enjoy (select all that apply)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Running', 'Walking', 'Yoga', 'Weightlifting', 'Swimming', 'Cycling', 'Dancing', 'HIIT'].map(type => {
                      const Icon = movementIcons[type] || Activity
                      return (
                        <ChoiceCard
                          key={type}
                          icon={Icon}
                          label={type}
                          isSelected={(formData.enjoyed_movement_types || []).includes(type)}
                          onClick={() => {
                            const current = formData.enjoyed_movement_types || []
                            const updated = current.includes(type)
                              ? current.filter(t => t !== type)
                              : [...current, type]
                            handleChange('enjoyed_movement_types', updated)
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </StepContainer>
        )

      case 5:
        return (
          <StepContainer stepKey={5}>
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 text-transparent mb-2">
                  Mental State
                </h2>
                <p className="text-white text-lg">How are you feeling?</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Current Mental State</label>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { state: 'Calm', emoji: '😌', message: "It's okay. We'll focus on maintaining your peace." },
                        { state: 'Stressed', emoji: '🤯', message: "It's okay. We'll focus on stress relief." },
                        { state: 'Anxious', emoji: '😰', message: "You're not alone. We'll help you find calm." },
                        { state: 'Burned out', emoji: '😓', message: "Rest is important. We'll prioritize recovery." },
                        { state: 'Motivated', emoji: '⚡', message: "Let's channel this energy into action!" }
                      ].map(({ state, emoji }) => (
                        <MentalStateCard
                          key={state}
                          emoji={emoji}
                          label={state}
                          isSelected={formData.current_mental_state === state}
                          onClick={() => handleChange('current_mental_state', state)}
                          color={state}
                        />
                      ))}
                    </div>
                    {/* Compassionate message appears below grid with enhanced fade-in */}
                    {formData.current_mental_state && MENTAL_STATE_MESSAGES[formData.current_mental_state] && (
                      <motion.div
                        key={formData.current_mental_state}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ 
                          duration: 0.5,
                          ease: "easeOut"
                        }}
                        className="text-center mt-6 p-4 bg-slate-800/40 backdrop-blur-md border border-purple-500/20 rounded-xl"
                      >
                        <p className="text-sm text-purple-200 italic font-medium leading-relaxed">
                          {MENTAL_STATE_MESSAGES[formData.current_mental_state]}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Biggest Struggle</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Overthinking', 'Emotional eating', 'Procrastination', 'Low confidence', 'Sleep issues'].map(struggle => (
                      <ChoiceCard
                        key={struggle}
                        label={struggle}
                        isSelected={formData.biggest_struggle === struggle}
                        onClick={() => handleChange('biggest_struggle', struggle)}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Sleep Quality</label>
                  <select
                    value={formData.sleep_quality}
                    onChange={(e) => handleChange('sleep_quality', e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl px-5 py-5 text-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="Very Poor">Very Poor</option>
                    <option value="Poor">Poor</option>
                    <option value="Fair">Fair</option>
                    <option value="Good">Good</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>
              </div>
            </div>
          </StepContainer>
        )

      case 6:
        return (
          <StepContainer stepKey={6}>
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 text-transparent mb-2">
                  Deeper Motivation
                </h2>
                <p className="text-white text-lg">What drives you?</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Why do you want to change?</label>
                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { tag: 'Feel more energetic', icon: '⚡' },
                      { tag: 'Boost confidence', icon: '💪' },
                      { tag: 'Improve long-term health', icon: '❤️' },
                      { tag: 'Look better', icon: '✨' },
                      { tag: 'Have more strength', icon: '🔥' },
                      { tag: 'Feel comfortable in my body', icon: '🌟' },
                      { tag: 'Set a good example', icon: '👨‍👩‍👧' },
                      { tag: 'Live longer', icon: '🌱' }
                    ].map(({ tag, icon }) => (
                      <motion.button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = formData.motivation_text || ''
                          const newText = current ? `${current} ${tag}` : tag
                          handleChange('motivation_text', newText)
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-200 text-sm font-medium hover:bg-purple-500/30 hover:border-purple-400/70 hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center gap-2"
                      >
                        <span>{icon}</span>
                        <span>{tag}</span>
                      </motion.button>
                    ))}
                  </div>
                  <textarea
                    value={formData.motivation_text}
                    onChange={(e) => handleChange('motivation_text', e.target.value)}
                    className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl px-5 py-5 text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all min-h-[140px] resize-none placeholder:text-gray-400"
                    placeholder="Share your motivation... (or click suggestion chips above)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">What are you afraid will happen if you do not change? (optional)</label>
                  {/* Fear-related Suggestion Chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { tag: 'Health problems', icon: '🏥' },
                      { tag: 'Lose confidence', icon: '😔' },
                      { tag: 'Miss opportunities', icon: '⏰' },
                      { tag: 'Feel stuck', icon: '🔒' },
                      { tag: 'Regret later', icon: '😢' },
                      { tag: 'Low self-esteem', icon: '💔' }
                    ].map(({ tag, icon }) => (
                      <motion.button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = formData.fear_text || ''
                          const newText = current ? `${current} ${tag}` : tag
                          handleChange('fear_text', newText)
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-full bg-red-500/20 border border-red-500/50 text-red-200 text-sm font-medium hover:bg-red-500/30 hover:border-red-400/70 hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center gap-2"
                      >
                        <span>{icon}</span>
                        <span>{tag}</span>
                      </motion.button>
                    ))}
                  </div>
                  <textarea
                    value={formData.fear_text}
                    onChange={(e) => handleChange('fear_text', e.target.value)}
                    className="w-full bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl px-5 py-5 text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all min-h-[140px] resize-none placeholder:text-gray-400"
                    placeholder="Share your concerns... (or click suggestion chips above)"
                  />
                </div>
              </div>
            </div>
          </StepContainer>
        )

      case 7:
        return (
          <StepContainer stepKey={7}>
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 text-transparent mb-2">
                  Coaching Preferences
                </h2>
                <p className="text-white text-lg">How would you like to be coached?</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Plan Strictness</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Gentle', 'Balanced', 'Strict'].map(strictness => (
                      <ChoiceCard
                        key={strictness}
                        label={strictness}
                        isSelected={formData.plan_strictness === strictness}
                        onClick={() => handleChange('plan_strictness', strictness)}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Reminder Frequency</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['None', 'Once a day', '2 to 3 times a day'].map(freq => (
                      <ChoiceCard
                        key={freq}
                        label={freq}
                        isSelected={formData.reminder_frequency === freq}
                        onClick={() => handleChange('reminder_frequency', freq)}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Motivation Tone</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Supportive', 'Direct', 'Tough Love'].map(tone => (
                      <ChoiceCard
                        key={tone}
                        label={tone}
                        isSelected={formData.motivation_tone === tone}
                        onClick={() => handleChange('motivation_tone', tone)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </StepContainer>
        )

      case 8:
        return (
          <StepContainer stepKey={8}>
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 text-transparent mb-2">
                  Commitment
                </h2>
                <p className="text-white text-lg">Are you ready to commit?</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">Are you ready to commit?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['Yes', 'Unsure but willing'].map(option => (
                      <ChoiceCard
                        key={option}
                        label={option}
                        isSelected={formData.commitment_ready === option}
                        onClick={() => handleChange('commitment_ready', option)}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-700">
                  <VisualSlider
                    label="Commitment Level"
                    value={formData.commitment_score}
                    onChange={(value) => handleChange('commitment_score', value)}
                    min={1}
                    max={10}
                    colorFrom="#ef4444"
                    colorTo="#10b981"
                  />
                </div>
              </div>
            </div>
          </StepContainer>
        )

      case 9:
        return (
          <StepContainer stepKey={9}>
            <div className="space-y-8">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-6 shadow-2xl"
                >
                  <Sparkles className="text-white" size={48} />
                </motion.div>
                <h2 className="text-4xl font-bold tracking-tight bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 text-transparent mb-2">
                  You're All Set!
                </h2>
                <p className="text-white text-lg">Here's a summary of your journey</p>
              </div>
              
              <div className="bg-slate-800/40 rounded-2xl p-6 space-y-4 backdrop-blur-sm border border-slate-700/50">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                  <span className="font-semibold text-white">Weight Goal</span>
                  <span className="text-indigo-300 font-bold">{formData.current_weight} lbs → {formData.goal_weight} lbs</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                  <span className="font-semibold text-white">Diet Style</span>
                  <span className="text-indigo-300 font-bold">{formData.dietary_preference}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                  <span className="font-semibold text-white">Activity Level</span>
                  <span className="text-indigo-300 font-bold">{formData.activity_level}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                  <span className="font-semibold text-white">Mental Focus</span>
                  <span className="text-indigo-300 font-bold">{formData.biggest_struggle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Coaching Tone</span>
                  <span className="text-indigo-300 font-bold">{formData.motivation_tone}</span>
                </div>
              </div>
            </div>
          </StepContainer>
        )

      default:
        return null
    }
  }

  // Segmented Progress Bar Component - Dark Theme with Glow
  const SegmentedProgressBar = () => {
    const segments = 5
    const segmentValue = totalSteps / segments
    const filledSegments = Math.floor((currentStep - 1) / segmentValue)
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-white">Step {currentStep} of {totalSteps}</span>
          <motion.span 
            key={currentStep}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-lg font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent"
          >
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </motion.span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: segments }).map((_, index) => {
            const isFilled = index <= filledSegments
            const isCurrent = Math.floor((currentStep - 1) / segmentValue) === index
            return (
              <motion.div
                key={index}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isFilled ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.1 }}
                className={`flex-1 h-3 rounded-full ${
                  isFilled 
                    ? isCurrent
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                      : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                    : 'bg-slate-800'
                }`}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-4xl relative z-10">
        {/* Dark Glass Card - Transparent to show Aurora */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="backdrop-blur-xl bg-slate-900/50 border border-slate-700 shadow-2xl rounded-3xl p-8 md:p-12"
        >
          {/* Segmented Progress Bar at top of card */}
          <SegmentedProgressBar />

          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-700/50">
            <motion.button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              whileHover={{ scale: currentStep === 1 ? 1 : 1.05 }}
              whileTap={{ scale: currentStep === 1 ? 1 : 0.95 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm text-white font-semibold hover:bg-slate-800 hover:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <ChevronLeft size={20} />
              Back
            </motion.button>

            {currentStep < totalSteps ? (
              <motion.button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                whileHover={{ scale: canProceed() ? 1.05 : 1 }}
                whileTap={{ scale: canProceed() ? 0.95 : 1 }}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Next
                <ChevronRight size={20} />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                whileHover={{ scale: (loading || !canProceed()) ? 1 : 1.05 }}
                whileTap={{ scale: (loading || !canProceed()) ? 0.95 : 1 }}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? 'Starting...' : 'Start My Journey'}
                <Sparkles size={20} />
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default OnboardingWizard
