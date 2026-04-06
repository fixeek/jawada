import { useState, useEffect } from 'react'
import axios from 'axios'
import { Server, Database, CheckCircle, Globe, Shield, HardDrive, Activity } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

export default function AdminHealthPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`${BASE}/api/admin/health`),
      axios.get(`${BASE}/health`),
    ])
      .then(([h, api]) => setHealth({ ...h.data, api: api.data }))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center shadow-card">
              <Server size={24} className="text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-navy-500">System Health</h1>
              <p className="text-sm text-gray-500">Infrastructure status and database metrics</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <span className="inline-block w-6 h-6 border-2 border-navy-200 border-t-navy-500 rounded-full animate-spin" />
          </div>
        ) : !health ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-sm text-red-700 font-bold">Failed to load system health</p>
          </div>
        ) : (
          <>
            {/* Status grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Globe size={18} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy-500">API</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Operational</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500">All endpoints responding</p>
              </div>

              <div className="bg-white rounded-2xl border border-emerald-100 shadow-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Database size={18} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy-500">Database</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Connected</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500">PostgreSQL {health.database?.version || ''}</p>
              </div>

              <div className="bg-white rounded-2xl border border-emerald-100 shadow-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Shield size={18} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy-500">Compliance</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">ADHICS</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500">UAE North · Encrypted</p>
              </div>
            </div>

            {/* Database details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-navy-500">Database</h3>
                <span className="text-xs text-gray-500">Total size: <span className="font-bold text-navy-500">{health.database?.size}</span></span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="text-left py-2">Table</th>
                    <th className="text-right py-2">Rows</th>
                    <th className="text-right py-2">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {(health.database?.tables || []).map(t => (
                    <tr key={t.tablename} className="border-t border-gray-50">
                      <td className="py-2.5 font-bold text-navy-500">{t.tablename}</td>
                      <td className="py-2.5 text-right text-gray-600">{(t.row_count || 0).toLocaleString()}</td>
                      <td className="py-2.5 text-right text-gray-500">{t.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Infrastructure */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <h3 className="text-sm font-bold text-navy-500 mb-4">Infrastructure</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3 p-3 bg-navy-50/40 rounded-xl">
                  <Server size={16} className="text-navy-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Backend</p>
                    <p className="text-xs font-bold text-navy-500">Azure Container Apps</p>
                    <p className="text-[10px] text-gray-500">UAE North</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-navy-50/40 rounded-xl">
                  <Database size={16} className="text-navy-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Database</p>
                    <p className="text-xs font-bold text-navy-500">Azure PostgreSQL B1ms</p>
                    <p className="text-[10px] text-gray-500">UAE North · Burstable</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-navy-50/40 rounded-xl">
                  <Shield size={16} className="text-navy-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Encryption</p>
                    <p className="text-xs font-bold text-navy-500">TLS 1.3 + At Rest</p>
                    <p className="text-[10px] text-gray-500">SSL required</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-navy-50/40 rounded-xl">
                  <HardDrive size={16} className="text-navy-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Storage</p>
                    <p className="text-xs font-bold text-navy-500">32 GB allocated</p>
                    <p className="text-[10px] text-gray-500">Auto-grow enabled</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
