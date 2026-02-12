import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Players from './pages/Players'
import PlayerForm from './pages/PlayerForm'
import Trainings from './pages/Trainings'
import Attendance from './pages/Attendance'
import AttendanceSession from './pages/AttendanceSession'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Profile from './pages/Profile'
import Calendar from './pages/Calendar'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="players" element={<Players />} />
        <Route path="players/new" element={<PlayerForm />} />
        <Route path="players/:id/edit" element={<PlayerForm />} />
        <Route path="trainings" element={<Trainings />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="attendance/:sessionId" element={<AttendanceSession />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="profile" element={<Profile />} />
        <Route path="calendar" element={<Calendar />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
