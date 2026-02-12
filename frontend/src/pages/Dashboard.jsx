import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  FiUsers, FiCalendar, FiCheckSquare, FiTrendingUp,
  FiArrowRight, FiActivity
} from 'react-icons/fi'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/analytics/dashboard')
      setData(response.data)
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Jugadores Activos',
      value: data?.totalPlayers || 0,
      icon: FiUsers,
      color: 'bg-blue-500',
      link: '/players'
    },
    {
      title: 'Asistencia Media',
      value: `${data?.avgAttendance || 0}%`,
      icon: FiActivity,
      color: 'bg-green-500',
      link: '/attendance'
    },
  ]

  // Formatear datos para el gráfico de tendencias
  const trendData = data?.trends?.reduce((acc, curr) => {
    const month = format(new Date(curr.month), 'MMM', { locale: es })
    let entry = acc.find(item => item.month === month)
    if (!entry) {
      entry = { month }
      acc.push(entry)
    }
    entry[curr.category] = parseFloat(curr.rate.toFixed(1))
    return acc
  }, []) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Panel de Control 🏐
          </h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 card-hover"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FiTrendingUp className="text-primary-600" />
            Tendencia de Asistencia (%)
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="cadete" name="Cadete" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="juvenil" name="Juvenil" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="junior" name="Junior" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="senior" name="Senior" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <Link
                to="/attendance"
                className="flex items-center gap-3 p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <FiCheckSquare className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-primary-900 text-sm">Pasar Lista</p>
                </div>
                <FiArrowRight className="text-primary-400 group-hover:translate-x-1 transition-transform" />
              </Link>


            </div>
          </div>

          <div className="bg-primary-900 rounded-xl p-5 text-white">
            <h3 className="font-bold text-lg mb-2">Estado del Club</h3>
            <p className="text-primary-100 text-sm leading-relaxed">
              Actualmente tienes {data?.totalPlayers} jugadores activos con una asistencia media del {data?.avgAttendance}% este mes.
            </p>
            <div className="mt-4 pt-4 border-t border-primary-800 flex items-center justify-between text-xs text-primary-300 uppercase tracking-widest">
              <span>Actualizado hace momento</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
