import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiPlus, FiChevronLeft, FiChevronRight, FiCalendar, FiArrowRight, FiCheckCircle, FiClock } from 'react-icons/fi'

export default function Attendance() {
  const [sessions, setSessions] = useState([])
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showNewSession, setShowNewSession] = useState(false)
  const [newSessionDate, setNewSessionDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedTraining, setSelectedTraining] = useState('')
  const [todayTraining, setTodayTraining] = useState(null)
  const [todaySession, setTodaySession] = useState(null)
  const [creatingToday, setCreatingToday] = useState(false)
  const navigate = useNavigate()

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  useEffect(() => {
    fetchData()
  }, [currentDate])

  const fetchData = async () => {
    try {
      const [sessionsRes, trainingsRes] = await Promise.all([
        api.get('/attendance/sessions', {
          params: {
            from: format(weekStart, 'yyyy-MM-dd'),
            to: format(weekEnd, 'yyyy-MM-dd')
          }
        }),
        api.get('/trainings?active=true')
      ])
      setSessions(sessionsRes.data)
      setTrainings(trainingsRes.data)

      // Comprobar si hoy hay entrenamiento
      const today = new Date()
      const todayDayOfWeek = today.getDay()
      const trainingToday = trainingsRes.data.find(t => t.day_of_week === todayDayOfWeek)
      setTodayTraining(trainingToday)

      // Comprobar si ya existe sesión para hoy
      const todayStr = format(today, 'yyyy-MM-dd')
      const existingTodaySession = sessionsRes.data.find(s => s.date === todayStr)
      setTodaySession(existingTodaySession)
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const goToTodayAttendance = async () => {
    setCreatingToday(true)
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      
      // Si ya existe sesión, ir directamente
      if (todaySession) {
        navigate(`/attendance/${todaySession.id}`)
        return
      }

      // Crear nueva sesión para hoy
      const response = await api.post('/attendance/sessions', {
        date: todayStr,
        training_id: todayTraining?.id || null
      })
      
      navigate(`/attendance/${response.data.id}`)
    } catch (error) {
      toast.error('Error al acceder a la sesión')
    } finally {
      setCreatingToday(false)
    }
  }

  const createSession = async () => {
    if (!newSessionDate) {
      toast.error('Selecciona una fecha')
      return
    }

    try {
      const response = await api.post('/attendance/sessions', {
        date: newSessionDate,
        training_id: selectedTraining || null
      })
      toast.success('Sesión creada')
      navigate(`/attendance/${response.data.id}`)
    } catch (error) {
      toast.error('Error al crear sesión')
    }
  }

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1))
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
          <p className="text-gray-600">Registra la asistencia a los entrenamientos</p>
        </div>
        <button
          onClick={() => setShowNewSession(!showNewSession)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
        >
          <FiPlus size={20} />
          Sesión Manual
        </button>
      </div>

      {/* TODAY'S TRAINING - Prominent Card */}
      {todayTraining && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <FiCheckCircle size={32} />
              </div>
              <div>
                <p className="text-primary-200 text-sm font-medium">Hoy hay entrenamiento</p>
                <h2 className="text-2xl font-bold">{todayTraining.day_name}</h2>
                <div className="flex items-center gap-2 mt-1 text-primary-100">
                  <FiClock size={16} />
                  <span>{todayTraining.start_time} - {todayTraining.end_time}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={goToTodayAttendance}
              disabled={creatingToday}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-md min-w-[200px]"
            >
              {creatingToday ? (
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheckCircle size={24} />
                  <span className="text-lg">
                    {todaySession ? 'Ver Asistencia' : 'Pasar Lista'}
                  </span>
                </>
              )}
            </button>
          </div>
          
          {todaySession && (
            <p className="mt-3 text-primary-200 text-sm">
              ✓ Ya tienes una sesión creada para hoy
            </p>
          )}
        </div>
      )}

      {/* No training today */}
      {!todayTraining && (
        <div className="bg-gray-100 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">😴</div>
          <h3 className="font-medium text-gray-700">Hoy no hay entrenamiento programado</h3>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      )}

      {/* New Session Form */}
      {showNewSession && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Crear Nueva Sesión</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={newSessionDate}
                onChange={(e) => setNewSessionDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entrenamiento (opcional)
              </label>
              <select
                value={selectedTraining}
                onChange={(e) => setSelectedTraining(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white"
              >
                <option value="">Sin asignar</option>
                {trainings.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.day_name} - {t.start_time} ({t.name})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowNewSession(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createSession}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Crear y Pasar Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Week Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiChevronLeft size={24} />
          </button>
          
          <div className="text-center">
            <h2 className="font-semibold text-gray-900">
              {format(weekStart, "d 'de' MMMM", { locale: es })} - {format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}
            </h2>
            <button
              onClick={goToToday}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Ir a hoy
            </button>
          </div>

          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay sesiones esta semana</h3>
          <p className="text-gray-500 mb-4">Crea una nueva sesión para registrar asistencia</p>
          <button
            onClick={() => setShowNewSession(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <FiPlus size={20} />
            Nueva Sesión
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={`/attendance/${session.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 card-hover"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FiCalendar className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {format(new Date(session.date), "EEEE", { locale: es })}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(session.date), "d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                </div>
                <FiArrowRight className="text-gray-400" />
              </div>

              {session.training_name && (
                <div className="text-sm text-gray-600 mb-2">
                  📍 {session.training_name} ({session.start_time} - {session.end_time})
                </div>
              )}

              <div className="text-xs text-gray-400">
                Toca para ver/editar asistencia
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
