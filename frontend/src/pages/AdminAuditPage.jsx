import { useState, useEffect } from 'react'
import axios from 'axios'
import { ScrollText, Building, CheckCircle, XCircle, AlertTriangle,
         Clock, Database, Shield, Filter } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

export default function AdminAuditPage() {
  const [entries, setEntries] = useState(null)
  const [filterFacility, setFilterFacility] = useState('all')

  useEffect(() => {
    axios.get(`${BASE}/api/admin/audit?limit=200`)
      .then(res => setEntries(res.data.entries || []))
      .catch(() => setEntries([]))
  }, [])

  const facilities = entries
    ? [...new Set(entries.map(e => e.facility_name).filter(Boolean))].sort()
    : []

  const filtered = entries?.filter(e =>
    filterFacility === 'all' || e.facility_name === filterFacility
  ) || []

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl flex items-center justify-center shadow-card">
              <ScrollText size={24} className="text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-navy-500">Platform Audit Log</h1>
              <p className="text-sm text-gray-500">All actions across all clinics</p>
            </div>
          </div>
        </div>

        {/* Compliance notice */}
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50/50 border border-indigo-100/60 rounded-2xl p-5 mb-6 flex gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <Shield size={18} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-800">Cross-Clinic Audit Trail</p>
            <p className="text-xs text-indigo-700/70 mt-1">
              Platform-wide log of every KPI calculation, file upload, and user action across all onboarded clinics.
              Required for DOH oversight and JDC compliance verification.
            </p>
          </div>
        </div>

        {/* Filter */}
        {facilities.length > 0 && (
          <div className="flex items-center gap-3 mb-5">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter by clinic:</span>
            <select value={filterFacility} onChange={e => setFilterFacility(e.target.value)}
              className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400">
              <option value="all">All clinics ({entries?.length})</option>
              {facilities.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} entries</span>
          </div>
        )}

        {entries === null ? (
          <div className="text-center py-20">
            <span className="inline-block w-6 h-6 border-2 border-navy-200 border-t-navy-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
            <ScrollText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-navy-500 mb-1">No audit entries</p>
            <p className="text-xs text-gray-500">Activity will appear here as clinics use the platform.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-50/50">
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-navy-400 uppercase tracking-wider">When</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-navy-400 uppercase tracking-wider">Clinic</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-navy-400 uppercase tracking-wider">Action</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-navy-400 uppercase tracking-wider">Quarter</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-navy-400 uppercase tracking-wider">Result</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-navy-400 uppercase tracking-wider">Records</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => {
                  const d = entry.details || {}
                  return (
                    <tr key={entry.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {entry.created_at ? new Date(entry.created_at).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        }) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-500">
                          <Building size={11} className="text-violet-400" />
                          {entry.facility_name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          entry.action === 'kpi_calculation' ? 'bg-teal-50 text-teal-700' :
                          entry.action === 'file_upload' ? 'bg-blue-50 text-blue-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {entry.action?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-navy-500">{entry.quarter || '—'}</td>
                      <td className="px-5 py-3">
                        {d.verdict ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            d.verdict === 'ready' ? 'text-emerald-700' :
                            d.verdict === 'attention' ? 'text-amber-700' : 'text-red-600'
                          }`}>
                            {d.verdict === 'ready' ? <CheckCircle size={11} /> :
                             d.verdict === 'attention' ? <AlertTriangle size={11} /> :
                             <XCircle size={11} />}
                            {d.meeting_target}/{d.calculable}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {d.total_records?.toLocaleString() || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
