import { useState, useEffect } from 'react'
import axios from 'axios'
import { Building, Users, FileText, Activity, TrendingUp, AlertTriangle,
         Database, Server, ChevronRight, CheckCircle, XCircle, Globe,
         Shield, UserPlus, Upload as UploadIcon, LogIn, Mail, Lock,
         AlertCircle, Clock } from 'lucide-react'
import { useAuth } from '../utils/auth'

const BASE = import.meta.env.VITE_API_URL || ''

function StatCard({ icon: Icon, label, value, sub, color = 'text-navy-500', bg = 'from-navy-50 to-navy-100/50', onClick }) {
  const Component = onClick ? 'button' : 'div'
  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-card p-6 transition-all text-left w-full ${
        onClick ? 'hover:shadow-elevated hover:-translate-y-0.5 hover:border-navy-100 cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${bg} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className={color} />
        </div>
        {onClick && <ChevronRight size={14} className="text-gray-300" />}
      </div>
      <div className={`text-3xl font-black ${color} tracking-tight`}>{value}</div>
      <div className="text-xs text-gray-500 font-semibold mt-1">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-1">{sub}</div>}
    </Component>
  )
}

function ActivityItem({ entry }) {
  const action = entry.action || 'unknown'
  const meta = (() => {
    switch (action) {
      case 'login_success':   return { icon: LogIn,        color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Sign-in' }
      case 'login_failed':    return { icon: AlertCircle,  color: 'text-red-500',     bg: 'bg-red-50',     label: 'Failed sign-in' }
      case 'login_blocked':   return { icon: Lock,         color: 'text-red-500',     bg: 'bg-red-50',     label: 'Blocked sign-in' }
      case 'kpi_calculation': return { icon: Activity,     color: 'text-teal-500',    bg: 'bg-teal-50',    label: 'KPI calculation' }
      case 'file_upload':     return { icon: UploadIcon,   color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'File upload' }
      default:                return { icon: Activity,     color: 'text-gray-500',    bg: 'bg-gray-50',    label: action.replace('_', ' ') }
    }
  })()

  const Icon = meta.icon
  const time = entry.created_at
    ? new Date(entry.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-8 h-8 ${meta.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon size={14} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-navy-500 truncate">
          {meta.label}
          {entry.facility_name && <span className="font-medium text-gray-500"> · {entry.facility_name}</span>}
        </p>
        <p className="text-[10px] text-gray-400 truncate">
          {entry.user_email || 'system'}
          {entry.quarter && <span> · {entry.quarter}</span>}
        </p>
      </div>
      <span className="text-[10px] text-gray-400 flex-shrink-0">{time}</span>
    </div>
  )
}

function HealthPill({ icon: Icon, label, status, sub }) {
  const colors = {
    healthy: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Operational' },
    warning: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Degraded' },
    error:   { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500',     label: 'Down' },
  }
  const c = colors[status] || colors.healthy
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex items-center gap-3">
      <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center`}>
        <Icon size={16} className={c.text} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-navy-500">{label}</p>
        <p className="text-[10px] text-gray-500 truncate">{sub || c.label}</p>
      </div>
      <div className={`w-2 h-2 rounded-full ${c.dot}`} />
    </div>
  )
}

export default function AdminOverviewPage({ onNavigate }) {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [clinicsKpi, setClinicsKpi] = useState([])
  const [loading, setLoading] = useState(true)
  const [healthStatus, setHealthStatus] = useState('healthy')

  useEffect(() => {
    Promise.all([
      axios.get(`${BASE}/api/admin/stats`).then(r => r.data).catch(() => null),
      axios.get(`${BASE}/health`).then(r => r.data).catch(() => null),
      axios.get(`${BASE}/api/admin/clinics-kpi`).then(r => r.data).catch(() => ({ clinics: [] })),
    ]).then(([s, h, ck]) => {
      setStats(s)
      setHealthStatus(h ? 'healthy' : 'error')
      setClinicsKpi(ck?.clinics || [])
      setLoading(false)
    })
  }, [])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const risks = stats?.risks || {}
  const totalRisks = (risks.clinics_never_uploaded || 0) + (risks.clinics_inactive_30d || 0)
  const failedLogins = risks.failed_logins_24h || 0

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-navy-500 tracking-tight">
            {greeting}, {user?.full_name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview · TriZodiac Super Admin</p>
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
            {/* ── SECTION 1: PLATFORM SIZE ─────────────────────────────────── */}
            <div className="mb-8">
              <h2 className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-3">Platform Size</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Building}
                  label="Active Clinics"
                  value={stats.facilities?.active || 0}
                  sub={`${stats.facilities?.total || 0} total registered`}
                  color="text-violet-600"
                  bg="from-violet-50 to-indigo-50"
                  onClick={() => onNavigate?.('clinics')}
                />
                <StatCard
                  icon={Users}
                  label="Total Users"
                  value={stats.users?.total || 0}
                  sub={`${stats.users?.active || 0} clinic users + ${stats.users?.platform_admins || 0} admin${(stats.users?.platform_admins || 0) === 1 ? '' : 's'}`}
                  color="text-blue-600"
                  bg="from-blue-50 to-cyan-50"
                  onClick={() => onNavigate?.('clinics')}
                />
                <StatCard
                  icon={UploadIcon}
                  label="Total Uploads"
                  value={stats.uploads?.total || 0}
                  sub={`${stats.uploads?.last_7_days || 0} in the last 7 days`}
                  color="text-teal-600"
                  bg="from-teal-50 to-emerald-50"
                  onClick={() => onNavigate?.('audit')}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Engagement"
                  value={`${stats.facilities?.engagement_pct || 0}%`}
                  sub={`${stats.facilities?.active_30d || 0} of ${stats.facilities?.active || 0} active in 30 days`}
                  color="text-emerald-600"
                  bg="from-emerald-50 to-green-50"
                  onClick={() => onNavigate?.('clinics')}
                />
              </div>
            </div>

            {/* ── SECTION 2: GROWTH + RISKS (side by side) ──────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Growth */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-4">This Week</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                        <Building size={14} className="text-violet-500" />
                      </div>
                      <span className="text-xs font-bold text-navy-500">New Clinics</span>
                    </div>
                    <span className="text-xl font-black text-navy-500">+{stats.growth?.new_clinics_7d || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <UserPlus size={14} className="text-blue-500" />
                      </div>
                      <span className="text-xs font-bold text-navy-500">New Users</span>
                    </div>
                    <span className="text-xl font-black text-navy-500">+{stats.growth?.new_users_7d || 0}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                        <UploadIcon size={14} className="text-teal-500" />
                      </div>
                      <span className="text-xs font-bold text-navy-500">Uploads</span>
                    </div>
                    <span className="text-xl font-black text-navy-500">{stats.uploads?.last_7_days || 0}</span>
                  </div>
                </div>
              </div>

              {/* Risks */}
              <div className={`bg-white rounded-2xl border shadow-card p-6 ${totalRisks > 0 ? 'border-amber-200' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Risks</h3>
                  {totalRisks > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{totalRisks} alerts</span>
                  )}
                </div>
                {totalRisks === 0 && failedLogins === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-2">
                      <CheckCircle size={18} className="text-emerald-500" />
                    </div>
                    <p className="text-xs font-bold text-navy-500">All clear</p>
                    <p className="text-[10px] text-gray-500">No active risks</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {risks.clinics_never_uploaded > 0 && (
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="font-bold text-navy-500">{risks.clinics_never_uploaded} clinic{risks.clinics_never_uploaded === 1 ? '' : 's'} never uploaded</p>
                          <p className="text-[10px] text-gray-500">Onboarding may have failed</p>
                        </div>
                      </div>
                    )}
                    {risks.clinics_inactive_30d > 0 && (
                      <div className="flex items-start gap-3">
                        <Clock size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="font-bold text-navy-500">{risks.clinics_inactive_30d} inactive 30+ days</p>
                          <p className="text-[10px] text-gray-500">Possible churn risk</p>
                        </div>
                      </div>
                    )}
                    {failedLogins > 0 && (
                      <div className="flex items-start gap-3">
                        <Lock size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="font-bold text-navy-500">{failedLogins} failed login{failedLogins === 1 ? '' : 's'} in 24h</p>
                          <p className="text-[10px] text-gray-500">Security signal</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Onboard Clinic',    icon: Building,    page: 'clinics' },
                    { label: 'Platform Audit',    icon: Activity,    page: 'audit' },
                    { label: 'System Health',     icon: Server,      page: 'health' },
                    { label: 'Settings',          icon: Shield,      page: 'settings' },
                  ].map(({ label, icon: Icon, page }) => (
                    <button key={label} onClick={() => onNavigate?.(page)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-navy-50/40 transition-colors text-left group">
                      <Icon size={14} className="text-gray-400 group-hover:text-navy-500" />
                      <span className="text-xs font-bold text-navy-500 flex-1">{label}</span>
                      <ChevronRight size={12} className="text-gray-300 group-hover:text-navy-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SECTION 3: RECENT ACTIVITY + SYSTEM HEALTH ───────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent activity */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Recent Activity</h3>
                  <button onClick={() => onNavigate?.('audit')}
                    className="text-[10px] font-bold text-navy-400 hover:text-navy-500 flex items-center gap-1">
                    View all <ChevronRight size={10} />
                  </button>
                </div>
                {(stats.recent_activity || []).length === 0 ? (
                  <div className="text-center py-8">
                    <Activity size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No activity yet</p>
                  </div>
                ) : (
                  <div>
                    {stats.recent_activity.map((entry, i) => (
                      <ActivityItem key={i} entry={entry} />
                    ))}
                  </div>
                )}
              </div>

              {/* System health */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-navy-400 uppercase tracking-widest">System Health</h3>
                <HealthPill icon={Globe}    label="API"          status={healthStatus}        sub="UAE North" />
                <HealthPill icon={Database} label="Database"     status="healthy"             sub="PostgreSQL · UAE North" />
                <HealthPill icon={Mail}     label="Email"        status="healthy"             sub="Azure Communication" />
                <HealthPill icon={Shield}   label="Compliance"   status="healthy"             sub="ADHICS V2" />
              </div>
            </div>
          </>
        )}

        {/* Clinic KPI Summary — per-clinic cards */}
        {clinicsKpi.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-black text-navy-500 mb-4">Clinic KPI Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinicsKpi.map(c => {
                const verdictColors = {
                  ready: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                  attention: 'bg-amber-50 border-amber-200 text-amber-700',
                  not_ready: 'bg-red-50 border-red-200 text-red-600',
                }
                const verdictLabels = { ready: 'Ready', attention: 'Attention', not_ready: 'Not Ready' }
                const lastUpload = c.last_upload ? (() => {
                  const d = new Date(c.last_upload)
                  const diff = Math.floor((Date.now() - d) / (1000*60*60*24))
                  return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff}d ago`
                })() : 'Never'

                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 hover:shadow-elevated transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-black text-navy-500">{c.name}</h3>
                        {c.license_no && <p className="text-[9px] text-gray-400">{c.license_no}</p>}
                      </div>
                      {c.verdict && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${verdictColors[c.verdict] || 'bg-gray-50 text-gray-500'}`}>
                          {verdictLabels[c.verdict] || '—'}
                        </span>
                      )}
                    </div>
                    {c.quarter ? (
                      <>
                        <div className="flex items-center gap-4 mb-3">
                          <div>
                            <div className="text-2xl font-black text-navy-500">{c.meeting_target || 0}/8</div>
                            <div className="text-[9px] text-gray-500 font-bold uppercase">KPIs Passing</div>
                          </div>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
                              style={{ width: `${(c.readiness_pct || 0)}%` }} />
                          </div>
                          <span className="text-xs font-bold text-navy-500">{c.readiness_pct || 0}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>{c.quarter}</span>
                          <span>{c.user_count || 0} users</span>
                          <span>Updated {lastUpload}</span>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-xs text-gray-400 font-medium">No data uploaded yet</p>
                        <p className="text-[9px] text-gray-300">Updated {lastUpload}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
