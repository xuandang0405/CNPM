import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLayout from './components/layouts/AdminLayout'
import DriverLayout from './components/layouts/DriverLayout'
import ParentLayout from './components/layouts/ParentLayout'
import AdminTracking from './pages/admin/Tracking'
import AdminSchedule from './pages/admin/Schedule'
import DriverHome from './pages/driver/Home'
import DriverTrip from './pages/driver/Trip'
import DriverMap from './pages/driver/Map'
import ParentDashboard from './pages/parent/Dashboard'
import ParentTracking from './pages/parent/Tracking'
import ParentNotifications from './pages/parent/Notifications'
import { useAuth } from './hooks/useAuth'

function PrivateRoute({ children, role }) {
  const { user } = useAuth()
  if (!user || !user.token) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin/*"
          element={
            <PrivateRoute role="admin">
              <AdminLayout />
            </PrivateRoute>
          }
        />

        <Route
          path="/driver/*"
          element={
            <PrivateRoute role="driver">
              <DriverLayout />
            </PrivateRoute>
          }
        />

      <Route
        path="/parent"
        element={
          <PrivateRoute role="parent">
            <ParentLayout>
              <ParentDashboard />
            </ParentLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/parent/tracking"
        element={
          <PrivateRoute role="parent">
            <ParentLayout>
              <ParentTracking />
            </ParentLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/parent/tracking/:childId"
        element={
          <PrivateRoute role="parent">
            <ParentLayout>
              <ParentTracking />
            </ParentLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/parent/notifications"
        element={
          <PrivateRoute role="parent">
            <ParentLayout>
              <ParentNotifications />
            </ParentLayout>
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
    </ThemeProvider>
  )
}
