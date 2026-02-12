import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import api from '../services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import './Calendar.css' // We'll create this to style it premium

export default function TrainingCalendar() {
    const [date, setDate] = useState(new Date())
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async () => {
        try {
            const response = await api.get('/attendance/sessions')
            setSessions(response.data)
        } catch (error) {
            toast.error('Error al cargar sesiones')
        } finally {
            setLoading(false)
        }
    }

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = format(date, 'yyyy-MM-dd')
            const session = sessions.find(s => s.date === dateStr)
            if (session) {
                return (
                    <div className="mt-1 flex justify-center">
                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    </div>
                )
            }
        }
        return null
    }

    const handleDateClick = async (clickedDate) => {
        const dateStr = format(clickedDate, 'yyyy-MM-dd')
        const existingSession = sessions.find(s => s.date === dateStr)

        if (existingSession) {
            navigate(`/attendance/${existingSession.id}`)
        } else {
            // Opcional: Crear sesión si es un día de entrenamiento configurado
            // Pero por ahora solo mostramos si existe
            toast('No hay sesión registrada para este día', { icon: 'ℹ️' })
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendario de Entrenamientos</h1>
                <p className="text-gray-600">Visualiza y accede a las sesiones pasadas y futuras</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-center">
                <Calendar
                    onChange={setDate}
                    value={date}
                    locale="es-ES"
                    tileContent={tileContent}
                    onClickDay={handleDateClick}
                    className="rounded-xl border-none shadow-none w-full max-w-2xl"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-lg font-semibold mb-4">Próximas Sesiones</h2>
                <div className="space-y-3">
                    {sessions.slice(0, 3).map(s => (
                        <div key={s.id} onClick={() => navigate(`/attendance/${s.id}`)} className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-900">{format(new Date(s.date), 'EEEE d MMMM', { locale: es })}</p>
                                <p className="text-sm text-gray-600">{s.training_name} ({s.start_time} - {s.end_time})</p>
                            </div>
                            <div className="text-primary-600 font-medium">Ver asistencia →</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
