/**
 * Auth context and utilities — manages JWT token + user state.
 */
import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'jawda_token'
const USER_KEY = 'jawda_user'

const AuthContext = createContext(null)

// Set up axios interceptor to attach token automatically
axios.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses globally
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      // Reload to trigger login screen
      if (window.location.pathname !== '/' || !window.location.hash.includes('login')) {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }

    axios.get(`${BASE}/api/auth/me`)
      .then(res => {
        setUser(res.data)
        localStorage.setItem(USER_KEY, JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { data } = await axios.post(`${BASE}/api/auth/login`, { email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  async function changePassword(newPassword) {
    await axios.post(`${BASE}/api/auth/change-password`, { new_password: newPassword })
    if (user) {
      const updated = { ...user, must_change_password: false }
      setUser(updated)
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// Role helpers
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  CLINIC_ADMIN: 'clinic_admin',
  QUALITY_OFFICER: 'quality_officer',
  VIEWER: 'viewer',
}

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  clinic_admin: 'Clinic Admin',
  quality_officer: 'Quality Officer',
  viewer: 'Viewer',
}

export function hasRole(user, ...roles) {
  return user && roles.includes(user.role)
}

export function isSuperAdmin(user) {
  return user?.role === ROLES.SUPER_ADMIN
}

export function isClinicAdmin(user) {
  return user?.role === ROLES.CLINIC_ADMIN
}

export function canManageUsers(user) {
  return hasRole(user, ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN)
}

export function canUpload(user) {
  return hasRole(user, ROLES.SUPER_ADMIN, ROLES.CLINIC_ADMIN, ROLES.QUALITY_OFFICER)
}
