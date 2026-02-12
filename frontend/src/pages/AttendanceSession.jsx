import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiArrowLeft, FiCheck, FiX, FiSave, FiMessageCircle } from 'react-icons/fi'

const CATEGORY_COLORS = {
  cadete: 'bg-green-100 text-green-800',
  juvenil: 'bg-blue-100 text-blue-800',
  junior: 'bg-purple-100 text-purple-800',
  senior: 'bg-orange-100 text-orange-800'
}

export default function AttendanceSession() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [attendanceList, setAttendanceList] = useState([])
  const [confirmations, setConfirmations] = useState([])
  const [pendingPlayers, setPendingPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSessionData()
  }, [sessionId])

  const fetchSessionData = async () => {
    try {
      const response = await api.get(`/attendance/sessions/${sessionId}`)
      setSession(response.data.session)

      // Combinar asistencia existente con jugadores pendientes
      const existingAttendance = response.data.attendance.map(a => ({
        player_id: a.player_id,
        name: a.name,
        last_name: a.last_name,
        category: a.category,
        position: a.position,
        attended: a.attended === 1,
        absence_reason: a.absence_reason || '',
        saved: true
      }))

      const pending = response.data.pendingPlayers.map(p => ({
        player_id: p.id,
        name: p.name,
        last_name: p.last_name,
        category: p.category,
        position: p.position,
        attended: null, // sin marcar
        absence_reason: '',
        saved: false
      }))

      setAttendanceList([...existingAttendance, ...pending])
      setPendingPlayers(response.data.pendingPlayers)
      setConfirmations(response.data.confirmations || [])
    } catch (error) {
      toast.error('Error al cargar la sesión')
      navigate('/attendance')
    } finally {
      setLoading(false)
    }
  }

  const toggleAttendance = (playerId, attended) => {
    setAttendanceList(prev => prev.map(item => {
      if (item.player_id === playerId) {
        return {
          ...item,
          attended,
          absence_reason: attended ? '' : item.absence_reason,
          saved: false
        }
      }
      return item
    }))
  }

  const updateAbsenceReason = (playerId, reason) => {
    setAttendanceList(prev => prev.map(item => {
      if (item.player_id === playerId) {
        return { ...item, absence_reason: reason, saved: false }
      }
      return item
    }))
  }

  const markAllPresent = () => {
    setAttendanceList(prev => prev.map(item => ({
      ...item,
      attended: true,
      absence_reason: '',
      saved: false
    })))
  }

  const markAllAbsent = () => {
    setAttendanceList(prev => prev.map(item => ({
      ...item,
      attended: false,
      saved: false
    })))
  }

  const saveAttendance = async () => {
    const unmarked = attendanceList.filter(a => a.attended === null)
    if (unmarked.length > 0) {
      toast.error(`Hay ${unmarked.length} jugadores sin marcar`)
      return
    }

    setSaving(true)
    try {
      await api.post('/attendance/bulk', {
        session_id: parseInt(sessionId),
        attendance: attendanceList.map(a => ({
          player_id: a.player_id,
          attended: a.attended,
          absence_reason: a.absence_reason || null
        }))
      })

      toast.success('Asistencia guardada correctamente')
      fetchSessionData() // Refrescar para marcar como guardado
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  const presentCount = attendanceList.filter(a => a.attended === true).length
  const absentCount = attendanceList.filter(a => a.attended === false).length
  const unmarkedCount = attendanceList.filter(a => a.attended === null).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/attendance')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {session && format(new Date(session.date), "EEEE d 'de' MMMM", { locale: es })}
          </h1>
          {session?.training_name && (
            <p className="text-gray-600">
              {session.training_name} ({session.start_time} - {session.end_time})
            </p>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-gray-500">Presentes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              <p className="text-xs text-gray-500">Ausentes</p>
            </div>
            {unmarkedCount > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{unmarkedCount}</p>
                <p className="text-xs text-gray-500">Sin marcar</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={markAllPresent}
              className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              Todos presentes
            </button>
            <button
              onClick={markAllAbsent}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Todos ausentes
            </button>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {attendanceList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay jugadores activos</h3>
            <p className="text-gray-500">Añade jugadores para poder registrar asistencia</p>
          </div>
        ) : (
          attendanceList.map((player) => (
            <div key={player.player_id} className="p-4">
              <div className="flex items-center gap-4">
                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate flex items-center gap-2">
                    {player.name} {player.last_name}
                    {confirmations.find(c => c.player_id === player.player_id)?.status === 'confirmed' && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200 uppercase font-bold">Confirmado</span>
                    )}
                    {confirmations.find(c => c.player_id === player.player_id)?.status === 'declined' && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full border border-red-200 uppercase font-bold">No asiste</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[player.category]}`}>
                      {player.category}
                    </span>
                    {player.position && (
                      <span className="text-xs text-gray-500">{player.position}</span>
                    )}
                  </div>
                </div>

                {/* Attendance Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAttendance(player.player_id, true)}
                    className={`p-3 rounded-lg transition-colors ${player.attended === true
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                      }`}
                  >
                    <FiCheck size={24} />
                  </button>
                  <button
                    onClick={() => toggleAttendance(player.player_id, false)}
                    className={`p-3 rounded-lg transition-colors ${player.attended === false
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'
                      }`}
                  >
                    <FiX size={24} />
                  </button>
                  {player.phone && (
                    <a
                      href={`https://wa.me/${player.phone.replace(/\s/g, '')}?text=${encodeURIComponent(`Hola ${player.name}, ¿confirmas tu asistencia al entrenamiento de hoy? 🏐`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Enviar recordatorio"
                    >
                      <FiMessageCircle size={24} />
                    </a>
                  )}
                </div>
              </div>

              {/* Absence Reason */}
              {player.attended === false && (
                <div className="mt-3 ml-0 sm:ml-4">
                  <input
                    type="text"
                    value={player.absence_reason}
                    onChange={(e) => updateAbsenceReason(player.player_id, e.target.value)}
                    placeholder="Motivo de la ausencia..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Save Button */}
      {attendanceList.length > 0 && (
        <div className="sticky bottom-4">
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <FiSave size={20} />
                Guardar Asistencia
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
