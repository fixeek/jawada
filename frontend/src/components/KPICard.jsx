const DOMAIN_STYLE = {
  Effectiveness:        'text-blue-600 bg-blue-50/80 border-blue-100/60',
  Safety:               'text-orange-600 bg-orange-50/80 border-orange-100/60',
  Timeliness:           'text-violet-600 bg-violet-50/80 border-violet-100/60',
  'Patient-Centredness':'text-pink-600 bg-pink-50/80 border-pink-100/60',
  Coordination:         'text-indigo-600 bg-indigo-50/80 border-indigo-100/60',
}

function GaugeArc({ pct, status, target, direction }) {
  const r = 40, circumference = Math.PI * r
  const filled = (pct / 100) * circumference
  const isInsufficient = status === 'insufficient_data'

  // Target tick position on the arc
  const targetAngle = (target / 100) * Math.PI
  const tickX = 48 - r * Math.cos(targetAngle)
  const tickY = 48 - r * Math.sin(targetAngle)

  const gradientId = `gauge-${status}-${pct}`
  return (
    <svg width="96" height="58" viewBox="0 0 96 58">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          {status === 'calculated' || status === 'proxy' ? (
            <><stop offset="0%" stopColor="#14B8A6" /><stop offset="100%" stopColor="#10B981" /></>
          ) : (
            <><stop offset="0%" stopColor="#E5E7EB" /><stop offset="100%" stopColor="#D1D5DB" /></>
          )}
        </linearGradient>
      </defs>
      {/* Track */}
      <path d={`M6 48 A${r} ${r} 0 0 1 90 48`}
        fill="none" stroke={isInsufficient ? '#F3F4F6' : '#E5E7EB'} strokeWidth="5" strokeLinecap="round" />
      {/* Filled arc */}
      <path d={`M6 48 A${r} ${r} 0 0 1 90 48`}
        fill="none" stroke={`url(#${gradientId})`} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={`${filled} ${circumference}`}
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }} />
      {/* Target tick mark */}
      {!isInsufficient && target > 0 && target < 100 && (
        <circle cx={tickX} cy={tickY} r="2.5" fill="#0D2137" opacity="0.4" />
      )}
      {/* Percentage text */}
      <text x="48" y="46" textAnchor="middle" fontSize="15" fontWeight="800" fill="#0D2137" letterSpacing="-0.5">
        {isInsufficient ? '—' : `${pct}%`}
      </text>
    </svg>
  )
}

export default function KPICard({ kpiId, kpi, prevKpi, prevQuarter, onClick }) {
  const domain = kpi.domain || ''
  const domainStyle = DOMAIN_STYLE[domain] || 'text-gray-600 bg-gray-50'
  const direction = kpi.target_direction || 'higher'
  const dirLabel = direction === 'lower' ? '↓ Lower is better' : '↑ Higher is better'

  // Trend vs previous quarter
  const trend = (() => {
    if (!prevKpi || prevKpi.denominator === 0 || kpi.denominator === 0) return null
    const diff = kpi.percentage - prevKpi.percentage
    if (Math.abs(diff) < 0.5) return { dir: 'stable', diff: 0 }
    // For "lower is better" KPIs, a decrease is good
    const improved = direction === 'lower' ? diff < 0 : diff > 0
    return { dir: improved ? 'up' : 'down', diff: Math.round(diff * 10) / 10, improved }
  })()

  // Pass/fail styling
  const isInsufficient = kpi.status === 'insufficient_data'
  const isNA = kpi.status === 'not_applicable'
  const meetsBadge = kpi.meets_target === true
    ? { text: `Meets target (${direction === 'lower' ? '≤' : '≥'}${kpi.target}%)`, style: 'text-emerald-700 bg-emerald-50 border-emerald-100' }
    : kpi.meets_target === false
    ? { text: `Below target (${kpi.percentage}% vs ${kpi.target}%)`, style: 'text-red-600 bg-red-50 border-red-100' }
    : null

  const topAccent = kpi.meets_target === true
    ? 'bg-gradient-to-r from-emerald-400 to-green-400'
    : kpi.meets_target === false
    ? 'bg-gradient-to-r from-red-400 to-rose-400'
    : kpi.status === 'proxy'
    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
    : isNA
    ? 'bg-gradient-to-r from-blue-200 to-indigo-200'
    : 'bg-gradient-to-r from-gray-200 to-gray-300'

  return (
    <div
      onClick={() => onClick({ kpiId, kpi })}
      className="bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer
        shadow-card hover:shadow-card-hover transition-all duration-300
        hover:-translate-y-1 group relative overflow-hidden"
    >
      <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full transition-opacity duration-300 ${topAccent} opacity-60 group-hover:opacity-100`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 mt-1">
        <span className="text-[11px] font-black text-navy-300 tracking-widest">{kpiId}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${domainStyle}`}>
          {domain}
        </span>
      </div>

      {/* Title */}
      <p className="text-[13px] font-bold text-navy-500 leading-snug mb-4 min-h-[2.5rem]">
        {kpi.title}
      </p>

      {/* Gauge + fraction */}
      <div className="flex items-end justify-between">
        <GaugeArc pct={kpi.percentage || 0} status={kpi.status} target={kpi.target || 50} direction={direction} />
        <div className="text-right pb-1">
          <div className="text-xl font-black text-navy-500 tracking-tight">
            {kpi.denominator > 0 ? `${kpi.numerator}/${kpi.denominator}` : '—'}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-semibold">{dirLabel}</div>
        </div>
      </div>

      {/* Pass/fail badge + trend */}
      <div className="mt-4 pt-3 border-t border-gray-100/80 flex items-center justify-between">
        <div>
          {meetsBadge ? (
            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border ${meetsBadge.style}`}>
              {meetsBadge.text}
            </span>
          ) : isNA ? (
            <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold border text-blue-600 bg-blue-50 border-blue-100">
              N/A — No eligible patients
            </span>
          ) : isInsufficient ? (
            <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold border text-gray-500 bg-gray-50 border-gray-100">
              Insufficient data
            </span>
          ) : (
            <span className="text-[10px] px-2.5 py-1 rounded-lg font-bold border text-amber-700 bg-amber-50 border-amber-100">
            Proxy — {kpi.percentage}%
          </span>
        )}
        </div>
        {trend && (
          <span className={`text-[10px] font-bold ${
            trend.dir === 'stable' ? 'text-gray-400' :
            trend.improved ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {trend.dir === 'stable' ? '→ 0%' :
             trend.diff > 0 ? `↑ +${trend.diff}%` : `↓ ${trend.diff}%`}
          </span>
        )}
      </div>
    </div>
  )
}
