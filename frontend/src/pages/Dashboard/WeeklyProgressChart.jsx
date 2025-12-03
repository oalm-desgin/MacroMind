import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'

const WeeklyProgressChart = () => {
  // Mock data - In production, this would come from the backend
  const mockData = [
    { day: 'Mon', calories: 2100, protein: 145, carbs: 195, fats: 68 },
    { day: 'Tue', calories: 2050, protein: 150, carbs: 190, fats: 65 },
    { day: 'Wed', calories: 2200, protein: 155, carbs: 200, fats: 70 },
    { day: 'Thu', calories: 2150, protein: 148, carbs: 198, fats: 69 },
    { day: 'Fri', calories: 2180, protein: 152, carbs: 202, fats: 71 },
    { day: 'Sat', calories: 2220, protein: 158, carbs: 205, fats: 72 },
    { day: 'Sun', calories: 2100, protein: 147, carbs: 192, fats: 67 }
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow-xl">
          <p className="text-slate-900 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-slate-700" style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.name === 'Calories' ? 'kcal' : 'g'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Weekly Progress</h2>
          <p className="text-slate-500 text-sm mt-1">Last 7 days nutrition tracking</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-500">
          <TrendingUp size={20} />
          <span className="text-sm font-medium">On Track</span>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
            <XAxis 
              dataKey="day" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
            />
            <Line 
              type="monotone" 
              dataKey="calories" 
              name="Calories"
              stroke="url(#caloriesGradient)" 
              strokeWidth={3}
              dot={{ fill: '#6366f1', r: 5 }}
              activeDot={{ r: 7, fill: '#8b5cf6' }}
            />
            <Line 
              type="monotone" 
              dataKey="protein" 
              name="Protein"
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 7, fill: '#059669' }}
            />
            <Line 
              type="monotone" 
              dataKey="carbs" 
              name="Carbs"
              stroke="#f59e0b" 
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 5 }}
              activeDot={{ r: 7, fill: '#d97706' }}
            />
            <Line 
              type="monotone" 
              dataKey="fats" 
              name="Fats"
              stroke="url(#fatsGradient)" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 5 }}
              activeDot={{ r: 7, fill: '#ec4899' }}
            />
            <defs>
              <linearGradient id="caloriesGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="fatsGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default WeeklyProgressChart

