import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart3, TrendingUp, TrendingDown, Minus, Target, CheckCircle,
         AlertTriangle, XCircle, Filter } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const KPI_META = {
  OMC001: { title: 'Asthma Medication Ratio', domain: 'Effectiveness', target: 50, dir: 'higher' },
  OMC002: { title: 'Avoidance of Antibiotics', domain: 'Safety', target: 50, dir: 'higher' },
  OMC003: { title: 'Time to See Physician', domain: 'Timeliness', target: 80, dir: 'higher' },
  OMC004: { title: 'BMI Assessment & Counselling', domain: 'Patient-Centredness', target: 50, dir: 'higher' },
  OMC005: { title: 'Diabetes HbA1c Control', domain: 'Effectiveness', target: 36, dir: 'higher' },
  OMC006: { title: 'Controlling High BP', domain: 'Effectiveness', target: 50, dir: 'higher' },
  OMC007: { title: 'Opioid Use Risk', domain: 'Coordination', target: 10, dir: 'lower' },
  OMC008: { title: 'Kidney Disease Eval (eGFR)', domain: 'Effectiveness', target: 50, dir: 'higher' },
}

const DOMAIN_COLORS = {
  Effectiveness: 'text-blue-600 bg-blue-50 border-blue-100',
  Safety: 'text-orange-600 bg-orange-50 border-orange-100',
  Timeliness: 'text-violet-600 bg-violet-50 border-violet-100',
  'Patient-Centredness': 'text-pink-600 bg-pink-50 border-pink-100',
  Coordination: 'text-indigo-600 bg-indigo-50 border-indigo-100',
}

const FILTERS = [
  { id: 'all', label: 'All KPIs' },
  { id: 'passing', label: 'Passing' },
  { id: 'failing', label: 'Below Target' },
  { id: 'na', label: 'N/A' },
]

export default function KPIExplorerPage({ onSelectKPI }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    axios.get(`${BASE}/api/clinic/dashboard`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-navy-200 border-t-navy-500 rounded-full animate-spin" />
      </div>
    )
  }

  const history = data?.history || {}
  const quarters = Object.keys(history).sort()
  const latestQ = quarters[quarters.length - 1]
  const latestKpis = latestQ ? (history[latestQ]?.kpis || {}) : {}
  const prevQ = quarters.length > 1 ? quarters[quarters.length - 2] : null
  const prevKpis = prevQ ? (history[prevQ]?.kpis || {}) : {}

  const kpiIds = Object.keys(KPI_META)
  const filtered = kpiIds.filter(id => {
    const k = latestKpis[id]
    if (!k) return filter === 'all' || filter === 'na'
    if (filter === 'passing') return k.meets_target === true
    if (filter === 'failing') return k.meets_target === false
    if (filter === 'na') return k.status === 'not_applicable' || k.status === 'insufficient_data'
    return true
  })

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center shadow-card">
            <BarChart3 size={24} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-navy-500">KPI Explorer</h1>
            <p className="text-sm text-gray-500">
              {latestQ ? `${latestQ} · All 8 DOH Jawda KPIs` : 'Upload data to see KPI results'}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6">
          <Filter size={14} className="text-gray-400" />
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                filter === f.id
                  ? 'bg-navy-500 text-white shadow-card'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
          {latestQ && (
            <span className="ml-auto text-[10px] text-gray-400 font-medium">
              {quarters.length} quarter{quarters.length > 1 ? 's' : ''} of history
            </span>
          )}
        </div>

        {!latestQ ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
            <BarChart3 size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-navy-500 mb-1">No KPI data yet</p>
            <p className="text-xs text-gray-500">Upload your clinic data to explore KPI results.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map(id => {
              const meta = KPI_META[id]
              const k = latestKpis[id]
              const prev = prevKpis[id]
              const isNA = !k || k.status === 'not_applicable'
              const isInsuff = k?.status === 'insufficient_data'
              const noData = isNA || isInsuff

              // Trend
              let delta = null
              if (k && prev && k.denominator > 0 && prev.denominator > 0) {
                delta = Math.round((k.percentage - prev.percentage) * 10) / 10
              }
              const improved = delta != null && delta !== 0 &&
                (meta.dir === 'lower' ? delta < 0 : delta > 0)

              // Mini sparkline data
              const sparkPoints = quarters.map(q => {
                const qk = history[q]?.kpis?.[id]
                if (!qk || qk.denominator === 0 || qk.status === 'insufficient_data') return null
                return qk.percentage
              })

              return (
                <button key={id} onClick={() => onSelectKPI?.(id)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 text-left
                    hover:shadow-elevated hover:-translate-y-1 transition-all group relative overflow-hidden">
                  {/* Top accent */}
                  <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-60 group-hover:opacity-100 ${
                    k?.meets_target === true ? 'bg-gradient-to-r from-emerald-400 to-green-400' :
                    k?.meets_target === false ? 'bg-gradient-to-r from-red-400 to-rose-400' :
                    isNA ? 'bg-gradient-to-r from-blue-200 to-indigo-200' :
                    'bg-gradient-to-r from-gray-200 to-gray-300'
                  }`} />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-2 mt-1">
                    <span className="text-[11px] font-black text-navy-300 tracking-widest">{id}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${DOMAIN_COLORS[meta.domain]}`}>
                      {meta.domain}
                    </span>
                  </div>

                  {/* Title */}
                  <p className="text-xs font-bold text-navy-500 leading-snug mb-3 min-h-[2rem]">{meta.title}</p>

                  {/* Score */}
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className={`text-2xl font-black tracking-tight ${
                        noData ? 'text-gray-300' :
                        k?.meets_target === true ? 'text-emerald-600' :
                        k?.meets_target === false ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {noData ? (isNA ? 'N/A' : '—') : `${k.percentage}%`}
                      </div>
                      {!noData && (
                        <div className="text-[10px] text-gray-500 font-medium">{k.numerator}/{k.denominator}</div>
                      )}
                    </div>
                    {delta != null && delta !== 0 && (
                      <div className={`flex items-center gap-1 text-[10px] font-bold ${
                        improved ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {improved ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {delta > 0 ? '+' : ''}{delta}%
                      </div>
                    )}
                  </div>

                  {/* Mini sparkline */}
                  {sparkPoints.some(p => p != null) && (
                    <div className="h-8 mb-2">
                      <svg width="100%" height="32" viewBox="0 0 160 32" className="overflow-visible">
                        {(() => {
                          const pts = sparkPoints.map((p, i) => {
                            if (p == null) return null
                            const x = sparkPoints.length === 1 ? 80 : 8 + (i * 144) / (sparkPoints.length - 1)
                            const y = 28 - (Math.min(100, Math.max(0, p)) / 100) * 24
                            return { x, y, p }
                          }).filter(Boolean)
                          const d = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')
                          const targetY = 28 - (meta.target / 100) * 24
                          return (
                            <>
                              <line x1="8" x2="152" y1={targetY} y2={targetY} stroke="#14B8A6" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.4" />
                              <path d={d} fill="none" stroke="#0D2137" strokeWidth="1.5" strokeLinecap="round" />
                              {pts.map((pt, i) => (
                                <circle key={i} cx={pt.x} cy={pt.y} r={i === pts.length - 1 ? 2.5 : 1.5}
                                  fill={pt.p >= meta.target ? '#10B981' : '#EF4444'} stroke="white" strokeWidth="1" />
                              ))}
                            </>
                          )
                        })()}
                      </svg>
                    </div>
                  )}

                  {/* Target + status */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100/80">
                    <span className="text-[9px] text-gray-400 font-medium">
                      {meta.dir === 'lower' ? '≤' : '≥'}{meta.target}%
                    </span>
                    {k?.meets_target === true && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">PASS</span>
                    )}
                    {k?.meets_target === false && (
                      <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">BELOW</span>
                    )}
                    {isNA && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">N/A</span>}
                    {isInsuff && <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">NO DATA</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
