import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiToggleLeft, FiToggleRight, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi'

const CATEGORIES = [
  { value: '', label: 'Todas' },
  { value: 'cadete', label: 'Cadete' },
  { value: 'juvenil', label: 'Juvenil' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' }
]

const CATEGORY_COLORS = {
  cadete: 'bg-green-100 text-green-800',
  juvenil: 'bg-blue-100 text-blue-800',
  junior: 'bg-purple-100 text-purple-800',
  senior: 'bg-orange-100 text-orange-800'
}

export default function Players() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    fetchPlayers()
  }, [showInactive])

  const fetchPlayers = async () => {
    try {
      const response = await api.get(`/players${showInactive ? '' : '?active=true'}`)
      setPlayers(response.data)
    } catch (error) {
      toast.error('Error al cargar jugadores')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (player) => {
    try {
      await api.patch(`/players/${player.id}/toggle-active`)
      toast.success(player.active ? 'Jugador dado de baja' : 'Jugador dado de alta')
      fetchPlayers()
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const deletePlayer = async (player) => {
    if (!confirm(`¿Eliminar permanentemente a ${player.name} ${player.last_name}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await api.delete(`/players/${player.id}`)
      toast.success('Jugador eliminado')
      fetchPlayers()
    } catch (error) {
      toast.error('Error al eliminar jugador')
    }
  }

  const filteredPlayers = players.filter(player => {
    const matchesSearch = `${player.name} ${player.last_name}`.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || player.category === categoryFilter
    return matchesSearch && matchesCategory
  })

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
          <h1 className="text-2xl font-bold text-gray-900">Jugadores</h1>
          <p className="text-gray-600">{filteredPlayers.length} jugadores</p>
        </div>
        <Link
          to="/players/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          <FiPlus size={20} />
          Nuevo Jugador
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white min-w-[140px]"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Show inactive */}
          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Mostrar inactivos</span>
          </label>
        </div>
      </div>

      {/* Players List */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🏐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay jugadores</h3>
          <p className="text-gray-500 mb-4">Añade tu primer jugador para empezar</p>
          <Link
            to="/players/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <FiPlus size={20} />
            Añadir Jugador
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 card-hover ${!player.active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {player.name} {player.last_name}
                  </h3>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[player.category]}`}>
                    {player.category.charAt(0).toUpperCase() + player.category.slice(1)}
                  </span>
                </div>
                {!player.active && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    Baja
                  </span>
                )}
              </div>

              <div className="space-y-1 text-sm text-gray-600 mb-4">
                {player.position && <p>📍 {player.position}</p>}
                {player.phone && <p>📱 {player.phone}</p>}
                {player.birth_date && (
                  <p>🎂 {new Date(player.birth_date).toLocaleDateString('es-ES')}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Link
                  to={`/players/${player.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <FiEdit2 size={16} />
                  Editar
                </Link>
                <button
                  onClick={() => toggleActive(player)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors text-sm font-medium ${
                    player.active 
                      ? 'text-orange-600 hover:bg-orange-50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {player.active ? <FiToggleLeft size={16} /> : <FiToggleRight size={16} />}
                  {player.active ? 'Baja' : 'Alta'}
                </button>
                <button
                  onClick={() => deletePlayer(player)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar permanentemente"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
