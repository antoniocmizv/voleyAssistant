import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiSave, FiArrowLeft } from 'react-icons/fi'

const CATEGORIES = [
  { value: 'cadete', label: 'Cadete' },
  { value: 'juvenil', label: 'Juvenil' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' }
]

const POSITIONS = [
  'Colocador/a',
  'Opuesto/a',
  'Central',
  'Receptor/a',
  'Líbero'
]

export default function PlayerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    phone: '',
    position: '',
    birth_date: '',
    category: 'senior'
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEditing)

  useEffect(() => {
    if (isEditing) {
      fetchPlayer()
    }
  }, [id])

  const fetchPlayer = async () => {
    try {
      const response = await api.get(`/players/${id}`)
      const player = response.data
      setFormData({
        name: player.name,
        last_name: player.last_name,
        phone: player.phone || '',
        position: player.position || '',
        birth_date: player.birth_date || '',
        category: player.category
      })
    } catch (error) {
      toast.error('Error al cargar jugador')
      navigate('/players')
    } finally {
      setFetching(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.last_name.trim()) {
      toast.error('Nombre y apellidos son obligatorios')
      return
    }

    setLoading(true)
    try {
      if (isEditing) {
        await api.put(`/players/${id}`, formData)
        toast.success('Jugador actualizado')
      } else {
        await api.post('/players', formData)
        toast.success('Jugador creado')
      }
      navigate('/players')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/players')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Jugador' : 'Nuevo Jugador'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Modifica los datos del jugador' : 'Añade un nuevo jugador al equipo'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Nombre"
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellidos *
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Apellidos"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="612 345 678"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posición
            </label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white"
            >
              <option value="">Sin especificar</option>
              {POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white"
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Birth Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Nacimiento
          </label>
          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/players')}
            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiSave size={20} />
            )}
            {isEditing ? 'Guardar Cambios' : 'Crear Jugador'}
          </button>
        </div>
      </form>
    </div>
  )
}
