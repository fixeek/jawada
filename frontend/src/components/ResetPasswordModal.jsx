import { useState } from 'react'
import axios from 'axios'
import { X, KeyRound, AlertCircle, CheckCircle, Copy, Mail } from 'lucide-react'
import { getErrorMessage } from '../utils/errors'

const BASE = import.meta.env.VITE_API_URL || ''

/* Admin-initiated password reset modal.
   Two steps: form (optional custom password) → result (shows temp password,
   email-sent badge, and copy button so admin can share manually if needed). */

export default function ResetPasswordModal({ targetUser, onClose }) {
  const [customPassword, setCustomPassword] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const body = useCustom && customPassword ? { new_password: customPassword } : {}
      const { data } = await axios.post(`${BASE}/api/users/${targetUser.id}/reset-password`, body)
      setResult(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password'))
    } finally {
      setLoading(false)
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(result.temp_password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 bg-navy-500/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-modal w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-navy-500 to-navy-400 px-7 py-5 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <KeyRound size={16} className="text-teal-300" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Reset Password</h2>
              <p className="text-navy-200 text-xs mt-0.5 truncate max-w-xs">{targetUser.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-navy-300 hover:text-white w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="p-7 space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              A new temporary password will be generated and emailed to <strong className="text-navy-500">{targetUser.full_name || targetUser.email}</strong>.
              They will be required to set a new password on next login.
            </p>

            <label className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all border-gray-100 hover:border-gray-200">
              <input type="checkbox" checked={useCustom} onChange={e => setUseCustom(e.target.checked)} className="mt-1" />
              <div>
                <p className="text-sm font-bold text-navy-500">Set a custom temporary password</p>
                <p className="text-[10px] text-gray-500">Otherwise the server will generate a secure 12-character password.</p>
              </div>
            </label>

            {useCustom && (
              <div>
                <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Custom Password (min 8 chars)</label>
                <input type="text" minLength="8" value={customPassword} onChange={e => setCustomPassword(e.target.value)}
                  className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
              </div>
            )}

            {error && (
              <div className="flex gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-navy-500 to-navy-400 text-white font-bold text-sm disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-7 space-y-4">
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-700">Password reset successfully</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {targetUser.full_name || targetUser.email} must set a new password on next login.
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Temporary Password</p>
              <div className="flex items-center gap-2 bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-3">
                <code className="flex-1 text-sm font-mono text-navy-500 break-all">{result.temp_password}</code>
                <button onClick={copyPassword}
                  className="text-gray-400 hover:text-teal-500 transition-colors flex-shrink-0">
                  {copied ? <CheckCircle size={16} className="text-teal-500" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">
                Save or copy this — it will not be shown again. The user will be forced to change it on first login.
              </p>
            </div>

            <div className={`flex gap-3 rounded-xl p-3 border ${
              result.email_sent
                ? 'bg-blue-50 border-blue-100'
                : 'bg-amber-50 border-amber-100'
            }`}>
              <Mail size={14} className={`flex-shrink-0 mt-0.5 ${result.email_sent ? 'text-blue-500' : 'text-amber-500'}`} />
              <p className={`text-xs font-medium ${result.email_sent ? 'text-blue-700' : 'text-amber-700'}`}>
                {result.email_sent
                  ? `Email with the temporary password was sent to ${targetUser.email}.`
                  : `Email could not be sent. Please share the password above with the user via a secure channel.`}
              </p>
            </div>

            <button onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-navy-500 to-navy-400 text-white font-bold text-sm">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
