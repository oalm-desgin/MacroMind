import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Sparkles } from 'lucide-react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import { useAuth } from '../../hooks/useAuth'

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const navigate = useNavigate()
  const { loginAsGuest } = useAuth()

  const handleGuestLogin = () => {
    loginAsGuest()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-4 shadow-lg shadow-purple-500/30">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent mb-3 tracking-tight">
            MacroMind
          </h1>
          <p className="text-white/90 text-lg font-medium">
            AI-Powered Nutrition & Meal Planning
          </p>
        </div>

        {/* Auth Form Card with Glass Effect */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-3xl shadow-2xl shadow-purple-500/20 p-8 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Toggle Tabs */}
          <div className="flex bg-slate-800/50 rounded-2xl p-1.5 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-300 ${
                isLogin
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 transform scale-105'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-300 ${
                !isLogin
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 transform scale-105'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form Content */}
          <div className="animate-fade-in">
            {isLogin ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>

        {/* Continue as Guest */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 backdrop-blur-sm bg-white/10 text-white/70 font-medium">or</span>
            </div>
          </div>
          
          <button
            onClick={handleGuestLogin}
            className="w-full backdrop-blur-xl bg-white/10 border border-white/20 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-white/20 hover:border-white/30 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
          >
            <User size={18} className="group-hover:scale-110 transition-transform duration-300" />
            Continue as Guest
          </button>
          
          <p className="text-center text-white/70 text-xs mt-4 font-medium">
            Explore the platform without creating an account
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-white/80 text-sm mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-pink-200 hover:from-indigo-100 hover:to-pink-100 font-semibold transition-all duration-300 underline decoration-2 underline-offset-2"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthPage

