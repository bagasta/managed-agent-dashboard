import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Agents from './pages/Agents'
import AgentDetail from './pages/AgentDetail'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import Arthur from './pages/Arthur'
import type { User } from './types'

const STORAGE_KEY = 'clevio_user'

export default function App() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try { setUser(JSON.parse(raw)) } catch {}
    }
  }, [])

  function handleLogin(u: User) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }
  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route
        path="/app"
        element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Overview user={user!} />} />
        <Route path="agents" element={<Agents />} />
        <Route path="agents/:id" element={<AgentDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="arthur" element={<Arthur user={user!} />} />
        <Route path="profile" element={<Profile user={user!} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
