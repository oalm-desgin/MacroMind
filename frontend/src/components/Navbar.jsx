import { Link, useLocation } from 'react-router-dom'
import { Home, MessageCircle, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Navbar = () => {
  const location = useLocation()
  const { logout, isGuest, user } = useAuth()

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              MacroMind
            </h1>
            {isGuest && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-300 rounded-md flex items-center gap-1 border border-orange-500/30">
                <User size={12} />
                Guest Mode
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive('/dashboard')
                  ? 'text-white bg-purple-500/20 border border-purple-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Home size={18} />
              Dashboard
            </Link>

            <Link
              to="/ai-coach"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                isActive('/ai-coach')
                  ? 'text-white bg-purple-500/20 border border-purple-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageCircle size={18} />
              AI Coach
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
            >
              <LogOut size={18} />
              {isGuest ? 'Exit Guest Mode' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

