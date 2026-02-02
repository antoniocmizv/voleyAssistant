import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format, subMonths } from 'date-fns'
import { FiDownload, FiFilter, FiFileText } from 'react-icons/fi'

const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'cadete', label: 'Cadete' },
  { value: 'juvenil', label: 'Juvenil' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' }
]

export default function Reports() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    from: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    player_id: ''
  })
  const [previewData, setPreviewData] = useState(null)

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const response = await api.get('/players?active=true')
      setPlayers(response.data)
    } catch (error) {
      console.error('Error al cargar jugadores')
    }
  }

  const fetchPreview = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.from) params.append('from', filters.from)
      if (filters.to) params.append('to', filters.to)
      if (filters.category) params.append('category', filters.category)
      if (filters.player_id) params.append('player_id', filters.player_id)

      const response = await api.get(`/reports/attendance?${params}`)
      setPreviewData(response.data)
    } catch (error) {
      toast.error('Error al generar vista previa')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (format) => {
    try {
      const params = new URLSearchParams()
      params.append('format', format)
      if (filters.from) params.append('from', filters.from)
      if (filters.to) params.append('to', filters.to)
      if (filters.category) params.append('category', filters.category)
      if (filters.player_id) params.append('player_id', filters.player_id)

      const response = await api.get(`/reports/attendance?${params}`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `asistencia_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success(`Reporte ${format.toUpperCase()} descargado`)
    } catch (error) {
      toast.error('Error al descargar reporte')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600">Genera informes de asistencia en PDF o Excel</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-primary-600" />
          <h2 className="font-semibold text-gray-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desde
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jugador
            </label>
            <select
              value={filters.player_id}
              onChange={(e) => setFilters({ ...filters, player_id: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white"
            >
              <option value="">Todos los jugadores</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.last_name}, {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <button
            onClick={fetchPreview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            <FiFileText size={20} />
            Vista Previa
          </button>
          <button
            onClick={() => downloadReport('pdf')}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            <FiDownload size={20} />
            Descargar PDF
          </button>
          <button
            onClick={() => downloadReport('excel')}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <FiDownload size={20} />
            Descargar Excel
          </button>
        </div>
      </div>

      {/* Preview */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      )}

      {previewData && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Vista Previa del Reporte</h2>
            <p className="text-sm text-gray-500">
              Período: {filters.from} - {filters.to}
            </p>
          </div>

          {previewData.summary.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos</h3>
              <p className="text-gray-500">No se encontraron registros con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jugador
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asistió
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faltó
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Asistencia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewData.summary.map((player, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {player.last_name}, {player.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600 capitalize">{player.category}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {player.total}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-green-600 font-medium">{player.attended}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-red-600 font-medium">{player.missed}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`font-medium ${
                          parseFloat(player.attendance_rate) >= 80 
                            ? 'text-green-600' 
                            : parseFloat(player.attendance_rate) >= 60 
                              ? 'text-yellow-600' 
                              : 'text-red-600'
                        }`}>
                          {player.attendance_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Absences Detail */}
          {previewData.summary.some(p => p.absences?.length > 0) && (
            <div className="p-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Detalle de Ausencias</h3>
              <div className="space-y-3">
                {previewData.summary.filter(p => p.absences?.length > 0).map((player, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-900 mb-2">
                      {player.last_name}, {player.name}
                    </p>
                    <ul className="space-y-1">
                      {player.absences.map((absence, i) => (
                        <li key={i} className="text-sm text-gray-600">
                          • {absence.date}: <span className="text-gray-500">{absence.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
