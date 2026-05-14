import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Vencimientos from './pages/Vencimientos'
import Facturacion from './pages/Facturacion'
import Notas from './pages/Notas'

function PrivateRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(undefined)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u || null))
    return unsub
  }, [])

  if (user === undefined) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} currentPath={location.pathname} onNavigate={navigate} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<PrivateRoute user={user}><Dashboard /></PrivateRoute>} />
          <Route path="/clientes" element={<PrivateRoute user={user}><Clientes /></PrivateRoute>} />
          <Route path="/vencimientos" element={<PrivateRoute user={user}><Vencimientos /></PrivateRoute>} />
          <Route path="/facturacion" element={<PrivateRoute user={user}><Facturacion /></PrivateRoute>} />
          <Route path="/notas" element={<PrivateRoute user={user}><Notas /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
