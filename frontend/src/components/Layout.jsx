import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  FiHome, FiUsers, FiCalendar, FiCheckSquare, 
  FiFileText, FiSettings, FiLogOut, FiMenu, FiX, FiUser 
} from 'react-icons/fi'

const navigation = [
  { name: 'Inicio', href: '/', icon: FiHome },
  { name: 'Jugadores', href: '/players', icon: FiUsers },
  { name: 'Entrenamientos', href: '/trainings', icon: FiCalendar },
  { name: 'Asistencia', href: '/attendance', icon: FiCheckSquare },
  { name: 'Reportes', href: '/reports', icon: FiFileText },
]

const adminNavigation = [
  { name: 'Usuarios', href: '/users', icon: FiSettings },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const allNavigation = user?.role === 'admin' 
    ? [...navigation, ...adminNavigation]
    : navigation

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-primary-800 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 bg-primary-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🏐</span>
              </div>
              <span className="text-white font-bold text-lg">VoleyAssistant</span>
            </div>
            <button 
              className="lg:hidden text-white p-2"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {allNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-white text-primary-800' 
                    : 'text-primary-100 hover:bg-primary-700'
                  }
                `}
              >
                <item.icon size={20} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-primary-700">
            <NavLink
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-2
                ${isActive 
                  ? 'bg-white text-primary-800' 
                  : 'text-primary-100 hover:bg-primary-700'
                }
              `}
            >
              <FiUser size={20} />
              <div className="flex-1 truncate">
                <p className="truncate">{user?.name}</p>
                <p className="text-xs opacity-75 truncate">{user?.email}</p>
              </div>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-900/30 transition-colors"
            >
              <FiLogOut size={20} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6">
          <button
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu size={24} />
          </button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <div className="animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
