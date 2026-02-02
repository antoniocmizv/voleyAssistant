import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiShield, FiUser } from 'react-icons/fi'

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user'
  })

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      toast.error('No tienes permisos para ver esta página')
      return
    }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.name || (!editingId && !formData.password)) {
      toast.error('Completa todos los campos obligatorios')
      return
    }

    try {
      const payload = { ...formData }
      if (editingId && !payload.password) {
        delete payload.password
      }

      if (editingId) {
        await api.put(`/users/${editingId}`, payload)
        toast.success('Usuario actualizado')
      } else {
        await api.post('/users', payload)
        toast.success('Usuario creado')
      }
      resetForm()
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar')
    }
  }

  const handleEdit = (user) => {
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role
    })
    setEditingId(user.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return

    try {
      await api.delete(`/users/${id}`)
      toast.success('Usuario eliminado')
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'user'
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900">Acceso Denegado</h2>
          <p className="text-gray-500">Solo los administradores pueden acceder a esta página</p>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600">Gestiona los usuarios de la aplicación</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <FiPlus size={20} />
            Nuevo Usuario
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Nombre completo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="usuario@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña {editingId ? '(dejar vacío para no cambiar)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="••••••••"
                required={!editingId}
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
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

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-primary-100' : 'bg-gray-100'
                      }`}>
                        {user.role === 'admin' ? (
                          <FiShield className="text-primary-600" size={20} />
                        ) : (
                          <FiUser className="text-gray-600" size={20} />
                        )}
                      </div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
