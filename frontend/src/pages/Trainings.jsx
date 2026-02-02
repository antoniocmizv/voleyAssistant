import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiClock } from 'react-icons/fi'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
]

export default function Trainings() {
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '19:00',
    end_time: '21:00',
    name: ''
  })

  useEffect(() => {
    fetchTrainings()
  }, [])

  const fetchTrainings = async () => {
    try {
      const response = await api.get('/trainings')
      setTrainings(response.data)
    } catch (error) {
      toast.error('Error al cargar entrenamientos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        await api.put(`/trainings/${editingId}`, formData)
        toast.success('Entrenamiento actualizado')
      } else {
        await api.post('/trainings', formData)
        toast.success('Entrenamiento creado')
      }
      resetForm()
      fetchTrainings()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar')
    }
  }

  const handleEdit = (training) => {
    setFormData({
      day_of_week: training.day_of_week,
      start_time: training.start_time,
      end_time: training.end_time,
      name: training.name || ''
    })
    setEditingId(training.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este entrenamiento?')) return

    try {
      await api.delete(`/trainings/${id}`)
      toast.success('Entrenamiento eliminado')
      fetchTrainings()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const resetForm = () => {
    setFormData({
      day_of_week: 1,
      start_time: '19:00',
      end_time: '21:00',
      name: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Entrenamientos</h1>
          <p className="text-gray-600">Configura los horarios de entrenamiento</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <FiPlus size={20} />
            Nuevo Horario
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Día
              </label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white"
              >
                {DAYS_OF_WEEK.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora Inicio
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora Fin
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre (opcional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Técnico"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiX className="inline mr-1" />
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              <FiSave className="inline mr-1" />
              {editingId ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* Trainings List */}
      {trainings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay entrenamientos configurados</h3>
          <p className="text-gray-500">Añade un horario de entrenamiento para empezar</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trainings.map((training) => (
            <div
              key={training.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 card-hover"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FiClock className="text-primary-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{training.day_name}</h3>
                  <p className="text-sm text-gray-500">{training.name}</p>
                </div>
              </div>

              <div className="text-2xl font-bold text-primary-600 mb-1">
                {training.start_time}
              </div>
              <p className="text-sm text-gray-500 mb-4">
                hasta {training.end_time}
              </p>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(training)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <FiEdit2 size={16} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(training.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <FiTrash2 size={16} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
