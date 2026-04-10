import { useState, useEffect } from 'react'
import axios from 'axios'
import { LayoutDashboard, Upload, ScrollText, Settings, Building, ChevronLeft,
         ChevronRight, Activity, Shield, Menu, X, Target, ClipboardList,
         FileWarning, BarChart3, Sparkles, ChevronRight as ArrowRight,
         Users as UsersIcon, LogOut, User as UserIcon, Server, Home,
         Send, FileText } from 'lucide-react'
import UploadPage from './pages/UploadPage'
import Dashboard from './pages/Dashboard'
import AuditPage from './pages/AuditPage'
import LoginPage from './pages/LoginPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import AdminOverviewPage from './pages/AdminOverviewPage'
import AdminClinicsPage from './pages/AdminClinicsPage'
import AdminClinicDetailPage from './pages/AdminClinicDetailPage'
import AdminAuditPage from './pages/AdminAuditPage'
import AdminHealthPage from './pages/AdminHealthPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import KPIExplorerPage from './pages/KPIExplorerPage'
import NotificationBell from './components/NotificationBell'
import KPIDetailPage from './pages/KPIDetailPage'
import SubmissionsPage from './pages/SubmissionsPage'
import ReportsPage from './pages/ReportsPage'
import AcceptInvitePage from './pages/AcceptInvitePage'
import { AuthProvider, useAuth, ROLES, ROLE_LABELS, isSuperAdmin, isClinicAdmin, canManageUsers, canUpload } from './utils/auth'
import { I18nProvider, useI18n, LanguageSwitcher } from './utils/i18n'

function getNavItems(user) {
  // Super admin has a completely different menu — platform management
  if (isSuperAdmin(user)) {
    return [
      { id: 'overview', label: 'Overview', icon: Home, section: 'Platform' },
      { id: 'clinics', label: 'Clinics', icon: Building, section: 'Platform' },
      { id: 'audit', label: 'Platform Audit', icon: ScrollText, section: 'Platform' },
      { id: 'health', label: 'System Health', icon: Server, section: 'Platform' },
      { id: 'settings', label: 'Settings', icon: Settings, section: 'Admin' },
    ]
  }

  // Clinic users (admin, quality officer, viewer)
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
  ]
  if (canUpload(user)) {
    items.push({ id: 'upload', label: 'Upload & Calculate', icon: Upload, section: 'Data' })
  }
  items.push({ id: 'kpi-explorer', label: 'KPI Explorer', icon: BarChart3, section: 'Data' })
  items.push({ id: 'submissions', label: 'Submissions', icon: Send, section: 'Compliance' })
  items.push({ id: 'reports', label: 'Reports', icon: FileText, section: 'Compliance' })
  items.push({ id: 'audit', label: 'Audit Trail', icon: ScrollText, section: 'Compliance' })

  if (canManageUsers(user)) {
    items.push({ id: 'users', label: 'Users', icon: UsersIcon, section: 'Admin' })
  }
  items.push({ id: 'settings', label: 'Settings', icon: Settings, section: 'Admin' })
  return items
}

function Sidebar({ active, onNavigate, collapsed, onCollapse, user, onLogout }) {
  const navItems = getNavItems(user)

  return (
    <aside className={`bg-navy-500 flex flex-col h-screen sticky top-0 transition-all duration-300 ${
      collapsed ? 'w-[68px]' : 'w-[240px]'
    }`}>
      <div className="px-4 py-5 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 bg-gradient-to-br from-teal-300 to-teal-500 rounded-xl flex items-center justify-center shadow-glow flex-shrink-0">
          <span className="text-white text-sm font-black">J</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <div className="text-white font-bold text-sm tracking-tight">Jawda KPI</div>
            <div className="text-navy-300 text-[9px] font-medium tracking-wide uppercase">by TriZodiac</div>
          </div>
        )}
        {!isSuperAdmin(user) && !collapsed && (
          <div className="flex-shrink-0 [&_button]:text-navy-300 [&_button:hover]:text-white [&_button:hover]:bg-white/10">
            <NotificationBell />
          </div>
        )}
      </div>

      {/* Facility badge */}
      {user?.facility_name && !collapsed && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Building size={13} className="text-teal-300 flex-shrink-0" />
            <span className="text-xs text-navy-200 font-medium truncate">{user.facility_name}</span>
          </div>
        </div>
      )}
      {isSuperAdmin(user) && !collapsed && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Shield size={13} className="text-amber-300 flex-shrink-0" />
            <span className="text-xs text-amber-200 font-bold">Super Admin</span>
          </div>
        </div>
      )}

      {/* Nav items — grouped by section */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {(() => {
          const sections = []
          let currentSection = null
          navItems.forEach(item => {
            if (item.section !== currentSection) {
              currentSection = item.section
              sections.push({ label: currentSection, items: [] })
            }
            sections[sections.length - 1].items.push(item)
          })
          return sections.map(section => (
            <div key={section.label} className="mb-2">
              {!collapsed && (
                <div className="px-3 pt-3 pb-1.5 text-[9px] font-bold text-navy-400 uppercase tracking-[0.15em]">
                  {section.label}
                </div>
              )}
              {collapsed && <div className="h-px bg-white/5 mx-2 my-2" />}
              <div className="space-y-0.5">
                {section.items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => onNavigate(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      active === id
                        ? 'bg-white/10 text-white shadow-inner-glow'
                        : 'text-navy-300 hover:text-white hover:bg-white/5'
                    }`}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={17} className="flex-shrink-0" />
                    {!collapsed && <span className="text-[13px]">{label}</span>}
                    {active === id && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))
        })()}
      </nav>

      {/* Language + User info + logout */}
      <div className="px-3 py-4 border-t border-white/5 space-y-2">
        <div className="px-1 pb-1">
          <LanguageSwitcher />
        </div>
        {!collapsed && user && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon size={11} className="text-teal-300" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-white font-bold truncate">{user.full_name || user.email}</p>
                <p className="text-[10px] text-navy-300 truncate">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-navy-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={onCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-navy-400 hover:text-navy-200 hover:bg-white/5 transition-all"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-xs">Collapse</span></>}
        </button>
      </div>
    </aside>
  )
}

function MobileNav({ active, onNavigate, user, onLogout }) {
  const [open, setOpen] = useState(false)
  const navItems = getNavItems(user)
  return (
    <>
      <div className="lg:hidden bg-navy-500 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-300 to-teal-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-black">J</span>
          </div>
          <span className="text-white font-bold text-sm">Jawda KPI</span>
        </div>
        <div className="flex items-center gap-2">
          {!isSuperAdmin(user) && (
            <div className="[&_button]:text-navy-300 [&_button:hover]:text-white">
              <NotificationBell />
            </div>
          )}
          <button onClick={() => setOpen(!open)} className="text-white p-1">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden bg-navy-500 px-4 pb-3 space-y-1 sticky top-[52px] z-20 border-b border-white/10">
          {user && (
            <div className="px-3 py-3 border-b border-white/10 mb-2">
              <p className="text-xs text-white font-bold">{user.full_name || user.email}</p>
              <p className="text-[10px] text-navy-300">{ROLE_LABELS[user.role]} {user.facility_name && `· ${user.facility_name}`}</p>
            </div>
          )}
          {(() => {
            const sections = []
            let currentSection = null
            navItems.forEach(item => {
              if (item.section !== currentSection) {
                currentSection = item.section
                sections.push({ label: currentSection, items: [] })
              }
              sections[sections.length - 1].items.push(item)
            })
            return sections.map(section => (
              <div key={section.label}>
                <div className="px-3 pt-2 pb-1 text-[9px] font-bold text-navy-400 uppercase tracking-wider">{section.label}</div>
                {section.items.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => { onNavigate(id); setOpen(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      active === id ? 'bg-white/10 text-white' : 'text-navy-300'
                    }`}>
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
            ))
          })()}
          <button
            onClick={() => { onLogout(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navy-300 mt-2 border-t border-white/10 pt-3"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </>
  )
}

const BASE = import.meta.env.VITE_API_URL || ''

function AppShell() {
  const { user, loading, logout } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [results, setResults] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [selectedKPI, setSelectedKPI] = useState(null)
  const [clinicLoading, setClinicLoading] = useState(false)
  const [clinicHistory, setClinicHistory] = useState(null) // { has_data, quarters, history, latest }

  // Auto-load clinic dashboard data on login (for clinic users only)
  useEffect(() => {
    if (!user || isSuperAdmin(user) || user.must_change_password) return
    if (results) return  // Already have fresh results from a calculation
    setClinicLoading(true)
    axios.get(`${BASE}/api/clinic/dashboard`)
      .then(res => {
        setClinicHistory(res.data)
        if (res.data.latest) {
          setResults(res.data.latest)
        }
      })
      .catch(() => setClinicHistory({ has_data: false, quarters: [], history: {}, latest: null }))
      .finally(() => setClinicLoading(false))
  }, [user?.id])

  // Set default page based on role
  const defaultPage = isSuperAdmin(user) ? 'overview' : 'dashboard'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-navy-200 border-t-navy-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Check for invitation token in URL
  const inviteToken = new URLSearchParams(window.location.search).get('invite')
  if (inviteToken && !user) {
    return <AcceptInvitePage token={inviteToken} />
  }

  if (!user) {
    return <LoginPage />
  }

  if (user.must_change_password) {
    return <ChangePasswordPage />
  }

  // If page is the default 'dashboard' but user is super admin, redirect to overview
  if (page === 'dashboard' && isSuperAdmin(user)) {
    setPage('overview')
    return null
  }

  function navigate(pageId) {
    setPage(pageId)
    setSelectedKPI(null)
    setSelectedClinic(null)
  }

  function handleResults(data) {
    setResults(data)
    setPage('dashboard')
    // Refresh clinic history cache so quarter list stays in sync
    axios.get(`${BASE}/api/clinic/dashboard`)
      .then(res => setClinicHistory(res.data))
      .catch(() => {})
  }

  function renderPage() {
    // Super admin pages
    if (isSuperAdmin(user)) {
      switch (page) {
        case 'overview':
          return <AdminOverviewPage onNavigate={navigate} />
        case 'clinics':
          return selectedClinic
            ? <AdminClinicDetailPage facility={selectedClinic} onBack={() => setSelectedClinic(null)} />
            : <AdminClinicsPage onSelectClinic={setSelectedClinic} />
        case 'audit':
          return <AdminAuditPage />
        case 'health':
          return <AdminHealthPage />
        case 'settings':
          return <SettingsPage user={user} />
        default:
          return <AdminOverviewPage onNavigate={navigate} />
      }
    }

    // Clinic user pages
    switch (page) {
      case 'dashboard':
        // Loading state while fetching clinic history (or before API call starts)
        if (clinicLoading || (!results && clinicHistory === null)) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <span className="inline-block w-8 h-8 border-2 border-navy-200 border-t-navy-500 rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-500 font-medium">Loading your dashboard...</p>
              </div>
            </div>
          )
        }

        // Has results (either from auto-load or fresh calculation) → show Dashboard
        if (results) {
          return (
            <Dashboard
              results={results}
              onBack={() => setPage('upload')}
              onAudit={() => setPage('audit')}
            />
          )
        }

        // Empty state — no data yet, clean welcome screen
        return (
          <div className="min-h-screen">
            <div className="max-w-3xl mx-auto px-6 py-16">
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-gradient-to-br from-navy-50 to-navy-100/50 rounded-3xl flex items-center justify-center shadow-card mx-auto mb-6">
                  <Building size={32} className="text-navy-400" />
                </div>
                <h1 className="text-3xl font-black text-navy-500 mb-2">{user.facility_name || 'Your Clinic'}</h1>
                <p className="text-gray-500 text-sm">Jawda KPI Dashboard</p>
              </div>

              {/* Main CTA */}
              <div className="bg-gradient-to-r from-navy-500 to-navy-400 rounded-2xl p-8 sm:p-10 text-center mb-8">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Upload size={28} className="text-teal-300" />
                </div>
                <h2 className="text-xl font-black text-white mb-2">No KPI Data Yet</h2>
                <p className="text-navy-200 text-sm leading-relaxed max-w-md mx-auto mb-6">
                  Upload your clinic's data files to see your Jawda KPI results here.
                  Start with the current quarter, or backfill historical quarters to build your trend.
                </p>
                {canUpload(user) ? (
                  <button onClick={() => setPage('upload')}
                    className="bg-white text-navy-500 font-bold text-sm px-8 py-3.5 rounded-xl shadow-elevated hover:shadow-card-hover transition-all inline-flex items-center gap-2">
                    Upload Data <ArrowRight size={16} />
                  </button>
                ) : (
                  <p className="text-navy-300 text-xs font-medium">Ask your clinic admin or quality officer to upload data.</p>
                )}
              </div>

              {/* What happens after upload */}
              <h3 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-4 text-center">What You'll See After Uploading</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Target, label: 'KPI Results', sub: '8 DOH KPIs with pass/fail', color: 'text-teal-500', bg: 'from-teal-50 to-emerald-50' },
                  { icon: ClipboardList, label: 'Action Plan', sub: 'Steps to fix gaps', color: 'text-blue-500', bg: 'from-blue-50 to-indigo-50' },
                  { icon: FileWarning, label: 'Data Quality', sub: 'Completeness check', color: 'text-amber-500', bg: 'from-amber-50 to-orange-50' },
                  { icon: BarChart3, label: 'DOH Export', sub: 'Jawda portal ready', color: 'text-violet-500', bg: 'from-violet-50 to-purple-50' },
                ].map(({ icon: Icon, label, sub, color, bg }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-card p-4 text-center">
                    <div className={`w-10 h-10 bg-gradient-to-br ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                      <Icon size={16} className={color} />
                    </div>
                    <p className="text-[11px] font-bold text-navy-500">{label}</p>
                    <p className="text-[9px] text-gray-500">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'upload':
        return canUpload(user)
          ? <UploadPage onResults={handleResults} facility={user.facility_name}
              existingQuarters={clinicHistory?.quarters || []}
              savedColMapping={clinicHistory?.saved_col_mapping || null} />
          : <div className="p-10 text-center text-gray-500">You don't have permission to upload data.</div>

      case 'kpi-explorer':
        if (selectedKPI) {
          return <KPIDetailPage kpiId={selectedKPI} onBack={() => setSelectedKPI(null)} />
        }
        return <KPIExplorerPage onSelectKPI={id => setSelectedKPI(id)} />

      case 'submissions':
        return <SubmissionsPage />

      case 'reports':
        return <ReportsPage />

      case 'audit':
        return <AuditPage facility={user.facility_name || results?.facility} onBack={() => setPage('dashboard')} />

      case 'clinics':
        if (!isSuperAdmin(user)) return null
        return selectedClinic
          ? <AdminClinicDetailPage facility={selectedClinic} onBack={() => setSelectedClinic(null)} />
          : <AdminClinicsPage onSelectClinic={setSelectedClinic} />

      case 'users':
        return canManageUsers(user) ? <UsersPage /> : null

      case 'settings':
        return <SettingsPage user={user} />

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white bg-mesh">
      <div className="hidden lg:flex">
        <Sidebar
          active={page}
          onNavigate={navigate}
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
          user={user}
          onLogout={logout}
        />
        <main className="flex-1 min-h-screen overflow-auto">
          {renderPage()}
        </main>
      </div>

      <div className="lg:hidden">
        <MobileNav active={page} onNavigate={navigate} user={user} onLogout={logout} />
        <main className="min-h-screen">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </I18nProvider>
  )
}
