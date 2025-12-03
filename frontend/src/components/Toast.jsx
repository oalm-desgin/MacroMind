import { useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react'

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertCircle
  }

  const styles = {
    success: {
      bg: 'bg-emerald-50/95 backdrop-blur-xl',
      border: 'border-emerald-200/50',
      text: 'text-emerald-700',
      icon: 'text-emerald-500',
      shadow: 'shadow-emerald-500/20'
    },
    error: {
      bg: 'bg-red-50/95 backdrop-blur-xl',
      border: 'border-red-200/50',
      text: 'text-red-700',
      icon: 'text-red-500',
      shadow: 'shadow-red-500/20'
    },
    info: {
      bg: 'bg-blue-50/95 backdrop-blur-xl',
      border: 'border-blue-200/50',
      text: 'text-blue-700',
      icon: 'text-blue-500',
      shadow: 'shadow-blue-500/20'
    },
    warning: {
      bg: 'bg-amber-50/95 backdrop-blur-xl',
      border: 'border-amber-200/50',
      text: 'text-amber-700',
      icon: 'text-amber-500',
      shadow: 'shadow-amber-500/20'
    }
  }

  const Icon = icons[type] || icons.success
  const style = styles[type] || styles.success

  return (
    <div className={`animate-slide-up ${style.bg} ${style.border} border-2 rounded-xl p-4 shadow-xl ${style.shadow} max-w-sm backdrop-blur-xl`}>
      <div className="flex items-start gap-3">
        <div className={`${style.icon} flex-shrink-0 mt-0.5`}>
          <Icon size={22} className="animate-scale-in" />
        </div>
        <p className={`${style.text} text-sm font-semibold flex-1 leading-relaxed`}>{message}</p>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity duration-200 p-1 rounded-lg hover:bg-black/5`}
          aria-label="Close notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export default Toast

