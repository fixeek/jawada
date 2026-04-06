import { useState } from 'react'
import { Lock, AlertCircle, CheckCircle, ChevronRight, Shield } from 'lucide-react'
import { useAuth } from '../utils/auth'

export default function ChangePasswordPage() {
  const { user, changePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await changePassword(password)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white bg-mesh flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-card">
            <Shield size={28} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-black text-navy-500 mb-2">Change Your Password</h1>
          <p className="text-sm text-gray-500">
            For security, please set a new password before continuing.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-navy-500 mb-2 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength="8"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-navy-50/40 border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm
                    focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-navy-500 mb-2 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength="8"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-navy-50/40 border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm
                    focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white"
                />
              </div>
            </div>

            {error && (
              <div className="flex gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2.5
                font-bold text-sm transition-all duration-300
                ${loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-navy-500 via-navy-400 to-navy-500 bg-[length:200%_100%] text-white shadow-elevated hover:shadow-card-hover hover:bg-right'
                }`}
            >
              {loading ? 'Saving...' : <>Set New Password <ChevronRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
