import { useState, useEffect } from 'react'
import axios from 'axios'
import { Building, KeyRound, CheckCircle, AlertCircle, Shield } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

export default function AcceptInvitePage({ token, onAccepted }) {
  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    axios.get(`${BASE}/api/invite/${token}`)
      .then(res => setInvite(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Invitation not found or expired.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleAccept(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setSubmitting(true); setError(null)
    try {
      const { data } = await axios.post(`${BASE}/api/invite/${token}/accept`, { password })
      setResult(data)
      // Store token and reload as logged-in user
      localStorage.setItem('jawda_token', data.token)
      localStorage.setItem('jawda_user', JSON.stringify(data.user))
      setTimeout(() => { window.location.href = '/' }, 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept invitation.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-500 to-navy-600">
        <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-500 to-navy-600 p-4">
        <div className="bg-white rounded-3xl shadow-modal w-full max-w-md p-8 text-center animate-scale-in">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-xl font-black text-navy-500 mb-2">Welcome to Jawda KPI!</h1>
          <p className="text-sm text-gray-500 mb-1">
            <strong>{result.facility_name}</strong> has been set up.
          </p>
          <p className="text-xs text-gray-400">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-500 to-navy-600 p-4">
      <div className="bg-white rounded-3xl shadow-modal w-full max-w-md animate-scale-in">
        <div className="bg-gradient-to-r from-navy-500 to-navy-400 px-8 py-6 rounded-t-3xl text-center">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Building size={24} className="text-teal-300" />
          </div>
          <h1 className="text-white font-bold text-lg">Join Jawda KPI Platform</h1>
          {invite && (
            <p className="text-navy-200 text-sm mt-1">{invite.facility_name}</p>
          )}
        </div>

        <div className="p-8">
          {!invite ? (
            <div className="text-center">
              <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-red-600 mb-1">{error || 'Invitation not found'}</p>
              <p className="text-xs text-gray-500">This invitation may have expired or already been used.</p>
            </div>
          ) : (
            <form onSubmit={handleAccept} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Email</label>
                <div className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy-500 font-medium">
                  {invite.admin_email}
                </div>
              </div>
              {invite.admin_full_name && (
                <div>
                  <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Name</label>
                  <div className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy-500 font-medium">
                    {invite.admin_full_name}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Set Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  minLength="8" required placeholder="Min 8 characters"
                  className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  minLength="8" required placeholder="Re-enter password"
                  className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15" />
              </div>
              {error && (
                <div className="flex gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700 font-medium">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {error}
                </div>
              )}
              <button type="submit" disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-navy-500 to-navy-400 text-white font-bold text-sm disabled:opacity-50">
                {submitting ? 'Setting up...' : 'Accept & Create Account'}
              </button>
              <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 pt-2">
                <div className="flex items-center gap-1"><Shield size={10} className="text-teal-400" /> ADHICS Compliant</div>
                <div className="flex items-center gap-1"><KeyRound size={10} className="text-teal-400" /> Encrypted</div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
