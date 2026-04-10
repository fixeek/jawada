import { useState } from 'react'
import axios from 'axios'
import { User as UserIcon, Target, Shield, Activity, Settings, Save, CheckCircle, AlertCircle, KeyRound } from 'lucide-react'
import { isSuperAdmin, isClinicAdmin, ROLE_LABELS, useAuth } from '../utils/auth'

const BASE = import.meta.env.VITE_API_URL || ''

function ChangePasswordSection() {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  async function handleChange(e) {
    e.preventDefault()
    if (newPassword.length < 8) { setResult({ ok: false, msg: 'Password must be at least 8 characters' }); return }
    if (newPassword !== confirm) { setResult({ ok: false, msg: 'Passwords do not match' }); return }
    setSaving(true); setResult(null)
    try {
      await axios.post(`${BASE}/api/auth/change-password`, { new_password: newPassword })
      setResult({ ok: true, msg: 'Password changed successfully' })
      setNewPassword(''); setConfirm('')
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.detail || 'Failed to change password' })
    } finally { setSaving(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
      <h3 className="text-sm font-bold text-navy-500 mb-4 flex items-center gap-2">
        <KeyRound size={14} className="text-violet-500" /> Change Password
      </h3>
      <form onSubmit={handleChange} className="space-y-3">
        <div>
          <label className="block text-[11px] font-bold text-navy-500 mb-1 uppercase tracking-wider">New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            minLength="8" required placeholder="Min 8 characters"
            className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-navy-500 mb-1 uppercase tracking-wider">Confirm Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            minLength="8" required placeholder="Re-enter password"
            className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15" />
        </div>
        {result && (
          <div className={`flex gap-2 rounded-xl p-3 text-xs font-medium ${result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {result.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {result.msg}
          </div>
        )}
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-navy-500 to-navy-400 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-card disabled:opacity-50">
          {saving ? 'Saving...' : <><Save size={14} /> Change Password</>}
        </button>
      </form>
    </div>
  )
}

export default function SettingsPage({ user }) {
  const isSA = isSuperAdmin(user)
  const isCA = isClinicAdmin(user)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center shadow-card">
          <Settings size={24} className="text-gray-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-navy-500 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500">{isSA ? 'Platform configuration and your account' : 'Your account and clinic preferences'}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <h3 className="text-sm font-bold text-navy-500 mb-4 flex items-center gap-2">
            <UserIcon size={14} className="text-blue-500" /> Your Account
          </h3>
          <div className="space-y-3 text-sm">
            {[
              ['Name', user?.full_name || '—'],
              ['Email', user?.email],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{label}</span>
                <span className="font-bold text-navy-500">{value}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Role</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isSA ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
              }`}>{ROLE_LABELS[user?.role]}</span>
            </div>
            {user?.facility_name && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Facility</span>
                <span className="font-bold text-navy-500">{user.facility_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Change password */}
        <ChangePasswordSection />

        {/* Super admin sections */}
        {isSA && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <h3 className="text-sm font-bold text-navy-500 mb-4 flex items-center gap-2">
                <Target size={14} className="text-teal-500" /> DOH KPI Targets
              </h3>
              <p className="text-xs text-gray-500 mb-4">Default thresholds from DOH Jawda Guidance V2 2026.</p>
              <div className="space-y-2 text-sm">
                {[
                  ['OMC001', 'Asthma Medication Ratio', '>= 50%'],
                  ['OMC002', 'Avoidance of Antibiotics', '>= 50%'],
                  ['OMC003', 'Time to See Physician', '>= 80%'],
                  ['OMC004', 'BMI Counselling', '>= 50%'],
                  ['OMC005', 'HbA1c <= 8.0%', '> 36%'],
                  ['OMC006', 'BP < 130/80', '>= 50%'],
                  ['OMC007', 'Opioid Use Risk', '<= 10%'],
                  ['OMC008', 'eGFR + uACR', '>= 50%'],
                ].map(([id, name, target]) => (
                  <div key={id} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-navy-300">{id}</span>
                      <span className="text-xs text-gray-600">{name}</span>
                    </div>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{target}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <h3 className="text-sm font-bold text-navy-500 mb-4 flex items-center gap-2">
                <Shield size={14} className="text-emerald-500" /> Security & Compliance
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Password policy', 'Min 8 characters'],
                  ['Session expiry', '12 hours'],
                  ['First login', 'Force password change'],
                  ['Audit retention', 'Indefinite'],
                  ['Data region', 'UAE North (Abu Dhabi)'],
                  ['Compliance', 'ADHICS V2'],
                ].map(([label, value], i, arr) => (
                  <div key={label} className={`flex justify-between py-2 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <span className="text-gray-500">{label}</span>
                    <span className="font-bold text-navy-500">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Platform info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <h3 className="text-sm font-bold text-navy-500 mb-4 flex items-center gap-2">
            <Activity size={14} className="text-violet-500" /> Platform Information
          </h3>
          <div className="space-y-3 text-sm">
            {[
              ['Product', 'Jawda KPI Platform'],
              ['Developer', 'TriZodiac'],
              ['DOH Guidance', 'V2 2026'],
              ['Data Region', 'UAE North (Abu Dhabi)'],
              ['Compliance', 'ADHICS V2'],
            ].map(([label, value], i, arr) => (
              <div key={label} className={`flex justify-between py-2 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <span className="text-gray-500">{label}</span>
                <span className="font-bold text-navy-500">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
