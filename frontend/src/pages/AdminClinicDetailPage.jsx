import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, Building, Users, Plus, Trash2, X, AlertCircle, CheckCircle,
         FileText, Calendar, Mail, Phone, MapPin, KeyRound } from 'lucide-react'
import { ROLE_LABELS } from '../utils/auth'
import { getErrorMessage } from '../utils/errors'
import ResetPasswordModal from '../components/ResetPasswordModal'

const BASE = import.meta.env.VITE_API_URL || ''

const ROLE_OPTIONS = [
  { value: 'clinic_admin', label: 'Clinic Admin', desc: 'Full control over clinic + manage users' },
  { value: 'quality_officer', label: 'Quality Officer', desc: 'Upload data, calculate KPIs, view results' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access to dashboard and audit' },
]

function CreateUserModal({ facilityId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: 'quality_officer',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function update(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const { data } = await axios.post(`${BASE}/api/users`, { ...form, facility_id: facilityId })
      onSuccess(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create user'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy-500/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-modal w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-navy-500 to-navy-400 px-7 py-5 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-white font-bold text-lg">Add User to Clinic</h2>
            <p className="text-navy-200 text-xs mt-0.5">Create a new team member</p>
          </div>
          <button onClick={onClose} className="text-navy-300 hover:text-white w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Full Name *</label>
            <input required value={form.full_name} onChange={e => update('full_name', e.target.value)}
              className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Email *</label>
            <input type="email" required value={form.email} onChange={e => update('email', e.target.value)}
              className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Initial Password *</label>
            <input type="password" required minLength="8" value={form.password} onChange={e => update('password', e.target.value)}
              className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
            <p className="text-[10px] text-gray-500 mt-1">User will be required to change this on first login</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-navy-500 mb-2 uppercase tracking-wider">Role *</label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  form.role === opt.value ? 'border-teal-400 bg-teal-50/40' : 'border-gray-100 hover:border-gray-200'
                }`}>
                  <input type="radio" name="role" value={opt.value} checked={form.role === opt.value}
                    onChange={() => update('role', opt.value)} className="mt-1" />
                  <div>
                    <p className="text-sm font-bold text-navy-500">{opt.label}</p>
                    <p className="text-[10px] text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

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
              {loading ? 'Creating...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminClinicDetailPage({ facility, onBack }) {
  const [users, setUsers] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)

  function loadUsers() {
    axios.get(`${BASE}/api/users?facility_id=${facility.id}`)
      .then(res => setUsers(res.data.users || []))
      .catch(() => setUsers([]))
  }

  useEffect(() => { loadUsers() }, [facility.id])

  async function handleDelete(userId, email) {
    if (!confirm(`Delete user ${email}?`)) return
    try {
      await axios.delete(`${BASE}/api/users/${userId}`)
      loadUsers()
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete user'))
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="text-gray-400 hover:text-navy-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-navy-50 to-navy-100/50 rounded-2xl flex items-center justify-center shadow-card">
              <Building size={24} className="text-navy-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-navy-500">{facility.name}</h1>
              <p className="text-sm text-gray-500">
                {facility.user_count || 0} users · {facility.upload_count || 0} uploads
              </p>
            </div>
          </div>
        </div>

        {/* Clinic info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
          <h3 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-4">Clinic Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {facility.license_no && (
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">License No.</p>
                <p className="text-navy-500 font-medium">{facility.license_no}</p>
              </div>
            )}
            {facility.doh_facility_id && (
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">DOH Facility ID</p>
                <p className="text-navy-500 font-medium">{facility.doh_facility_id}</p>
              </div>
            )}
            {facility.address && (
              <div className="sm:col-span-2">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin size={10} /> Address
                </p>
                <p className="text-navy-500 font-medium">{facility.address}</p>
              </div>
            )}
            {facility.contact_name && (
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Contact Name</p>
                <p className="text-navy-500 font-medium">{facility.contact_name}</p>
              </div>
            )}
            {facility.contact_email && (
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Mail size={10} /> Email
                </p>
                <p className="text-navy-500 font-medium">{facility.contact_email}</p>
              </div>
            )}
            {facility.contact_phone && (
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Phone size={10} /> Phone
                </p>
                <p className="text-navy-500 font-medium">{facility.contact_phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Users size={16} className="text-blue-500" />
              <h3 className="text-sm font-bold text-navy-500">Clinic Users</h3>
              <span className="text-xs text-gray-400">({users?.length || 0})</span>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-navy-500 to-navy-400 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-card hover:shadow-card-hover transition-all">
              <Plus size={14} /> Add User
            </button>
          </div>

          {users === null ? (
            <div className="p-12 text-center"><span className="inline-block w-6 h-6 border-2 border-navy-200 border-t-navy-500 rounded-full animate-spin" /></div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={28} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-navy-500 mb-1">No users in this clinic yet</p>
              <p className="text-xs text-gray-500">Click "Add User" to add team members.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-50/50">
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-navy-400 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-navy-400 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-navy-400 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-navy-400 uppercase tracking-wider">Last Login</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-5 py-3 font-bold text-navy-500">{u.full_name || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString('en-GB') : 'Never'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setResetTarget(u)}
                          title="Reset password"
                          className="text-gray-400 hover:text-teal-500 transition-colors">
                          <KeyRound size={14} />
                        </button>
                        <button onClick={() => handleDelete(u.id, u.email)}
                          title="Delete user"
                          className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateUserModal
          facilityId={facility.id}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); loadUsers() }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          targetUser={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  )
}
