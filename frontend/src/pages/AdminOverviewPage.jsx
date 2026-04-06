import { useState, useEffect } from 'react'
import axios from 'axios'
import { Building, Users, FileText, Activity, TrendingUp, ShieldCheck,
         ShieldAlert, ShieldX, Database, Server, ChevronRight,
         CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { useAuth } from '../utils/auth'

const BASE = import.meta.env.VITE_API_URL || ''

function StatCard({ icon: Icon, label, value, sub, color = 'text-navy-500', bg = 'from-navy-50 to-navy-100/50' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 hover:shadow-elevated transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${bg} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className={color} />
        </div>
      </div>
      <div className={`text-3xl font-black ${color} tracking-tight`}>{value}</div>
      <div className="text-xs text-gray-500 font-semibold mt-1">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

export default function AdminOverviewPage({ onNavigate }) {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${BASE}/api/admin/stats`)
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-navy-500 tracking-tight">
            {greeting}, {user?.full_name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview and key metrics</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <span className="inline-block w-8 h-8 border-2 border-navy-200 border-t-navy-500 rounded-full animate-spin" />
          </div>
        ) : !stats ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-sm text-red-700 font-bold">Failed to load platform stats</p>
          </div>
        ) : (
          <>
            {/* Top stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Building}
                label="Active Clinics"
                value={stats.facilities?.active || 0}
                sub={`${stats.facilities?.total || 0} total`}
                color="text-violet-600"
                bg="from-violet-50 to-indigo-50"
              />
              <StatCard
                icon={Users}
                label="Active Users"
                value={stats.users?.active || 0}
                sub="across all clinics"
                color="text-blue-600"
                bg="from-blue-50 to-cyan-50"
              />
              <StatCard
                icon={FileText}
                label="Total Uploads"
                value={stats.uploads?.total || 0}
                sub={`${stats.uploads?.last_7_days || 0} this week`}
                color="text-teal-600"
                bg="from-teal-50 to-emerald-50"
              />
              <StatCard
                icon={ShieldCheck}
                label="Ready for Submission"
                value={stats.compliance?.ready || 0}
                sub={`of ${stats.compliance?.total_summaries || 0} clinic-quarters`}
                color="text-emerald-600"
                bg="from-emerald-50 to-green-50"
              />
            </div>

            {/* Compliance breakdown + Quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Compliance breakdown */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <h3 className="text-sm font-bold text-navy-500 mb-5">Compliance Status (Latest Quarter per Clinic)</h3>
                {(() => {
                  const verdicts = stats.compliance?.verdict_breakdown || {}
                  const ready = verdicts.ready || 0
                  const attention = verdicts.attention || 0
                  const notReady = verdicts.not_ready || 0
                  const total = ready + attention + notReady || 1
                  return (
                    <>
                      <div className="space-y-3 mb-5">
                        {[
                          { label: 'Ready for Submission', count: ready, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                          { label: 'Needs Attention', count: attention, color: 'bg-amber-400', textColor: 'text-amber-700' },
                          { label: 'Not Ready', count: notReady, color: 'bg-red-400', textColor: 'text-red-600' },
                        ].map(({ label, count, color, textColor }) => (
                          <div key={label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-gray-600 font-medium">{label}</span>
                              <span className={`text-xs font-bold ${textColor}`}>{count} clinics</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${color} rounded-full transition-all`}
                                style={{ width: `${(count / total) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      {ready + attention + notReady === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">No KPI calculations yet</p>
                      )}
                    </>
                  )
                })()}
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <h3 className="text-sm font-bold text-navy-500 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Onboard Clinic', icon: Building, page: 'clinics', color: 'text-violet-500' },
                    { label: 'View All Clinics', icon: Building, page: 'clinics', color: 'text-blue-500' },
                    { label: 'Platform Audit', icon: Activity, page: 'audit', color: 'text-indigo-500' },
                    { label: 'System Health', icon: Server, page: 'health', color: 'text-teal-500' },
                  ].map(({ label, icon: Icon, page, color }) => (
                    <button key={label} onClick={() => onNavigate && onNavigate(page)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-navy-50/40 transition-colors text-left group">
                      <Icon size={16} className={color} />
                      <span className="text-xs font-bold text-navy-500 flex-1">{label}</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-navy-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <h3 className="text-sm font-bold text-navy-500 mb-4">Upload Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Last 7 days</span>
                    <span className="text-lg font-black text-navy-500">{stats.uploads?.last_7_days || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Last 30 days</span>
                    <span className="text-lg font-black text-navy-500">{stats.uploads?.last_30_days || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-gray-500">All time</span>
                    <span className="text-lg font-black text-navy-500">{stats.uploads?.total || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <h3 className="text-sm font-bold text-navy-500 mb-4">Engagement</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Clinics with data uploaded</span>
                    <span className="text-lg font-black text-navy-500">
                      {stats.facilities?.with_data || 0}
                      <span className="text-xs text-gray-400 ml-1">/ {stats.facilities?.active || 0}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-gray-500">Engagement rate</span>
                    <span className="text-lg font-black text-navy-500">
                      {stats.facilities?.active > 0
                        ? Math.round(((stats.facilities?.with_data || 0) / stats.facilities.active) * 100)
                        : 0}%
                    </span>
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
