import { useState, useEffect } from 'react'
import axios from 'axios'
import { Building, Plus, Users, FileText, X, AlertCircle, CheckCircle,
         ChevronRight, Sparkles, Mail, Copy } from 'lucide-react'
import { getErrorMessage } from '../utils/errors'

const BASE = import.meta.env.VITE_API_URL || ''

function OnboardModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', license_no: '', doh_facility_id: '', address: '',
    contact_name: '', contact_email: '', contact_phone: '',
    admin_email: '', admin_password: '', admin_full_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const { data } = await axios.post(`${BASE}/api/admin/facilities`, form)
      onSuccess(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to onboard clinic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy-500/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-navy-500 to-navy-400 px-7 py-5 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-white font-bold text-lg">Onboard New Clinic</h2>
            <p className="text-navy-200 text-xs mt-0.5">Register a new outpatient medical center</p>
          </div>
          <button onClick={onClose} className="text-navy-300 hover:text-white w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          <div>
            <h3 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-3">Clinic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-navy-500 mb-1.5">Clinic Name *</label>
                <input required value={form.name} onChange={e => update('name', e.target.value)}
                  placeholder="Al Noor Medical Center"
                  className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-navy-500 mb-1.5">License No.</label>
                  <input value={form.license_no} onChange={e => update('license_no', e.target.value)}
                    className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-navy-500 mb-1.5">DOH Facility ID</label>
                  <input value={form.doh_facility_id} onChange={e => update('doh_facility_id', e.target.value)}
                    className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-navy-500 mb-1.5">Address</label>
                <input value={form.address} onChange={e => update('address', e.target.value)}
                  className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-3">Primary Contact</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-navy-500 mb-1.5">Contact Name</label>
                <input value={form.contact_name} onChange={e => update('contact_name', e.target.value)}
                  className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-navy-500 mb-1.5">Email</label>
                  <input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)}
                    className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-navy-500 mb-1.5">Phone</label>
                  <input value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)}
                    className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-3">Clinic Admin User *</h3>
            <p className="text-[10px] text-gray-500 mb-3">This user will have full control over the clinic. They will be required to change their password on first login.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-navy-500 mb-1.5">Full Name *</label>
                <input required value={form.admin_full_name} onChange={e => update('admin_full_name', e.target.value)}
                  className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-navy-500 mb-1.5">Email *</label>
                <input type="email" required value={form.admin_email} onChange={e => update('admin_email', e.target.value)}
                  className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-navy-500 mb-1.5">Initial Password *</label>
                <input type="password" required minLength="8" value={form.admin_password} onChange={e => update('admin_password', e.target.value)}
                  className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white" />
              </div>
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
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-navy-500 to-navy-400 text-white font-bold text-sm hover:shadow-card-hover transition-all disabled:opacity-50">
              {loading ? 'Creating...' : 'Onboard Clinic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminClinicsPage({ onSelectClinic }) {
  const [facilities, setFacilities] = useState(null)
  const [showOnboard, setShowOnboard] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ facility_name: '', admin_email: '', admin_full_name: '', license_no: '' })
  const [inviteResult, setInviteResult] = useState(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [success, setSuccess] = useState(null)

  function loadFacilities() {
    axios.get(`${BASE}/api/admin/facilities`)
      .then(res => setFacilities(res.data.facilities || []))
      .catch(() => setFacilities([]))
  }

  useEffect(() => { loadFacilities() }, [])

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl flex items-center justify-center shadow-card">
              <Building size={24} className="text-violet-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-navy-500">Clinics</h1>
              <p className="text-sm text-gray-500">Manage all registered clinics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 bg-teal-50 text-teal-700 font-bold text-sm px-5 py-3 rounded-xl border border-teal-200 hover:bg-teal-100 transition-all">
              <Mail size={16} /> Send Invite
            </button>
            <button onClick={() => setShowOnboard(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-navy-500 to-navy-400 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-elevated hover:shadow-card-hover transition-all">
              <Plus size={16} /> Onboard Clinic
            </button>
          </div>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800">Clinic onboarded successfully</p>
              <p className="text-xs text-emerald-700 mt-1">
                Admin user: {success.admin_user.email}
              </p>
            </div>
            <button onClick={() => setSuccess(null)}><X size={16} className="text-emerald-600" /></button>
          </div>
        )}

        {facilities === null ? (
          <div className="text-center py-20"><span className="inline-block w-6 h-6 border-2 border-navy-200 border-t-navy-500 rounded-full animate-spin" /></div>
        ) : facilities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
            <Building size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-navy-500 mb-1">No clinics yet</p>
            <p className="text-xs text-gray-500 mb-5">Onboard your first clinic to get started.</p>
            <button onClick={() => setShowOnboard(true)}
              className="bg-gradient-to-r from-navy-500 to-navy-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl">
              Onboard First Clinic
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map(f => (
              <button
                key={f.id}
                onClick={() => onSelectClinic && onSelectClinic(f)}
                className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-elevated transition-all p-5 text-left hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-navy-50 to-navy-100/50 rounded-xl flex items-center justify-center">
                    <Building size={18} className="text-navy-400" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${f.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                    {f.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="text-sm font-black text-navy-500 mb-1">{f.name}</h3>
                {f.license_no && <p className="text-[10px] text-gray-500 mb-3">License: {f.license_no}</p>}
                <div className="flex items-center gap-4 text-[10px] text-gray-500 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1"><Users size={11} /> {f.user_count || 0} users</span>
                  <span className="flex items-center gap-1"><FileText size={11} /> {f.upload_count || 0} uploads</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showOnboard && (
        <OnboardModal
          onClose={() => setShowOnboard(false)}
          onSuccess={(data) => {
            setSuccess(data)
            setShowOnboard(false)
            loadFacilities()
          }}
        />
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-navy-500/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => { setShowInvite(false); setInviteResult(null) }}>
          <div className="bg-white rounded-3xl shadow-modal w-full max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-teal-500 to-teal-400 px-7 py-5 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-white font-bold text-lg">Send Clinic Invitation</h2>
                <p className="text-teal-100 text-xs mt-0.5">Clinic admin will receive an email to set up their account</p>
              </div>
              <button onClick={() => { setShowInvite(false); setInviteResult(null) }} className="text-teal-200 hover:text-white w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            {inviteResult ? (
              <div className="p-7 space-y-4">
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Invitation sent!</p>
                    <p className="text-xs text-emerald-600 mt-0.5">An email has been sent to {inviteForm.admin_email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Invitation Link</p>
                  <div className="flex items-center gap-2 bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-3">
                    <code className="flex-1 text-[10px] font-mono text-navy-500 break-all">{inviteResult.invite_url}</code>
                    <button onClick={() => { navigator.clipboard.writeText(inviteResult.invite_url) }}
                      className="text-gray-400 hover:text-teal-500 transition-colors flex-shrink-0">
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1.5">Share this link if the email doesn't arrive. Expires in 7 days.</p>
                </div>
                <button onClick={() => { setShowInvite(false); setInviteResult(null); setInviteForm({ facility_name: '', admin_email: '', admin_full_name: '', license_no: '' }) }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-navy-500 to-navy-400 text-white font-bold text-sm">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault()
                setInviteLoading(true)
                try {
                  const { data } = await axios.post(`${BASE}/api/admin/invitations`, inviteForm)
                  setInviteResult(data)
                } catch (err) {
                  alert(getErrorMessage(err, 'Failed to send invitation'))
                } finally {
                  setInviteLoading(false)
                }
              }} className="p-7 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Clinic Name *</label>
                  <input required value={inviteForm.facility_name} onChange={e => setInviteForm(f => ({ ...f, facility_name: e.target.value }))}
                    className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Admin Email *</label>
                  <input type="email" required value={inviteForm.admin_email} onChange={e => setInviteForm(f => ({ ...f, admin_email: e.target.value }))}
                    className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">Admin Full Name</label>
                  <input value={inviteForm.admin_full_name} onChange={e => setInviteForm(f => ({ ...f, admin_full_name: e.target.value }))}
                    className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-navy-500 mb-1.5 uppercase tracking-wider">License No</label>
                  <input value={inviteForm.license_no} onChange={e => setInviteForm(f => ({ ...f, license_no: e.target.value }))}
                    className="w-full bg-navy-50/40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowInvite(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={inviteLoading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-white font-bold text-sm disabled:opacity-50">
                    {inviteLoading ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
