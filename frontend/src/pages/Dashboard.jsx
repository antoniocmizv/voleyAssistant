import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiUsers, FiCalendar, FiCheckSquare, FiTrendingUp, FiArrowRight } from 'react-icons/fi'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activePlayers: 0,
    todayTraining: null,
    recentSessions: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [playersRes, trainingsRes, sessionsRes] = await Promise.all([
        api.get('/players'),
        api.get('/trainings?active=true'),
        api.get('/attendance/sessions?from=' + format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
      ])

      const players = playersRes.data
      const trainings = trainingsRes.data
      const today = new Date().getDay()
      
      const todayTraining = trainings.find(t => t.day_of_week === today)

      setStats({
        totalPlayers: players.length,
        activePlayers: players.filter(p => p.active).length,
        todayTraining,
        recentSessions: sessionsRes.data.slice(0, 5)
      })
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
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
      value: stats.activePlayers,
      subtitle: `${stats.totalPlayers} total`,
      icon: FiUsers,
      color: 'bg-blue-500',
      link: '/players'
    },
    {
      title: 'Entrenamiento Hoy',
      value: stats.todayTraining ? `${stats.todayTraining.start_time}` : 'No hay',
      subtitle: stats.todayTraining ? `hasta ${stats.todayTraining.end_time}` : 'Descanso',
      icon: FiCalendar,
      color: stats.todayTraining ? 'bg-green-500' : 'bg-gray-400',
      link: '/trainings'
    },
    {
      title: 'Última Semana',
      value: stats.recentSessions.length,
      subtitle: 'sesiones registradas',
      icon: FiCheckSquare,
      color: 'bg-purple-500',
      link: '/attendance'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          ¡Bienvenido! 🏐
        </h1>
        <p className="text-gray-600 mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 card-hover"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/attendance"
            className="flex items-center gap-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <FiCheckSquare className="text-primary-600" size={24} />
            <div className="flex-1">
              <p className="font-medium text-primary-900">Pasar Lista</p>
              <p className="text-sm text-primary-600">Registrar asistencia</p>
            </div>
            <FiArrowRight className="text-primary-400" />
          </Link>

          <Link
            to="/players/new"
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <FiUsers className="text-green-600" size={24} />
            <div className="flex-1">
              <p className="font-medium text-green-900">Nuevo Jugador</p>
              <p className="text-sm text-green-600">Añadir al equipo</p>
            </div>
            <FiArrowRight className="text-green-400" />
          </Link>

          <Link
            to="/reports"
            className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <FiTrendingUp className="text-purple-600" size={24} />
            <div className="flex-1">
              <p className="font-medium text-purple-900">Generar Reporte</p>
              <p className="text-sm text-purple-600">PDF o Excel</p>
            </div>
            <FiArrowRight className="text-purple-400" />
          </Link>

          <Link
            to="/trainings"
            className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <FiCalendar className="text-orange-600" size={24} />
            <div className="flex-1">
              <p className="font-medium text-orange-900">Horarios</p>
              <p className="text-sm text-orange-600">Ver entrenamientos</p>
            </div>
            <FiArrowRight className="text-orange-400" />
          </Link>
        </div>
      </div>

      {/* Recent Sessions */}
      {stats.recentSessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sesiones Recientes</h2>
            <Link to="/attendance" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recentSessions.map((session) => (
              <Link
                key={session.id}
                to={`/attendance/${session.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {session.training_name || 'Entrenamiento'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(session.date), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                </div>
                <FiArrowRight className="text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
