import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/* ── Multi-Quarter KPI Trend Charts ────────────────────────────────────────── */
/* Renders a small SVG line chart per KPI showing % across all stored quarters,
   with target line, current value, and direction arrow. Pure SVG, no deps.    */

const KPI_ORDER = ['OMC001','OMC002','OMC003','OMC004','OMC005','OMC006','OMC007','OMC008']

function MiniChart({ points, target, direction, width = 220, height = 70 }) {
  const padX = 8, padY = 10
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  // Use 0–100 scale always, so target line is comparable
  const xs = points.map((_, i) => points.length === 1
    ? padX + innerW / 2
    : padX + (i * innerW) / (points.length - 1))
  const ys = points.map(p => p == null ? null : padY + innerH - (Math.min(100, Math.max(0, p)) / 100) * innerH)

  // Build path string skipping nulls
  let d = ''
  let started = false
  xs.forEach((x, i) => {
    const y = ys[i]
    if (y == null) { started = false; return }
    d += (started ? ' L ' : 'M ') + x.toFixed(1) + ' ' + y.toFixed(1)
    started = true
  })

  const targetY = target != null
    ? padY + innerH - (Math.min(100, Math.max(0, target)) / 100) * innerH
    : null

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* Target line */}
      {targetY != null && (
        <line
          x1={padX} x2={width - padX}
          y1={targetY} y2={targetY}
          stroke="#14B8A6"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.6"
        />
      )}
      {/* Trend line */}
      {d && <path d={d} fill="none" stroke="#0D2137" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {/* Dots */}
      {xs.map((x, i) => {
        const y = ys[i]
        if (y == null) return null
        const pct = points[i]
        const passing = target != null
          ? (direction === 'lower' ? pct <= target : pct >= target)
          : null
        const fill = passing == null ? '#9CA3AF' : passing ? '#10B981' : '#EF4444'
        const isLast = i === xs.length - 1
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={isLast ? 3.2 : 2.4}
            fill={fill}
            stroke="white"
            strokeWidth={isLast ? 1.5 : 1}
          />
        )
      })}
    </svg>
  )
}

export default function TrendChart({ history, currentQuarter }) {
  const [selectedKpi, setSelectedKpi] = useState(null)
  if (!history) return null

  const quarters = Object.keys(history).sort()
  if (quarters.length < 2) return null  // need 2+ quarters to make a trend

  // Build per-KPI series across quarters
  const series = KPI_ORDER.map(id => {
    const points = quarters.map(q => {
      const k = history[q]?.kpis?.[id]
      if (!k || k.denominator === 0 || k.status === 'insufficient_data') return null
      return k.percentage
    })
    // Pull title/target/direction from first quarter that has it
    const meta = quarters
      .map(q => history[q]?.kpis?.[id])
      .find(k => k && k.title)
    if (!meta) return null

    const valid = points.filter(p => p != null)
    const first = valid[0]
    const last = valid[valid.length - 1]
    const delta = (first != null && last != null) ? Math.round((last - first) * 10) / 10 : null
    const direction = meta.target_direction || 'higher'
    const improved = delta != null && delta !== 0 && (direction === 'lower' ? delta < 0 : delta > 0)
    const declined = delta != null && delta !== 0 && !improved
    const passing = last != null && meta.target != null
      ? (direction === 'lower' ? last <= meta.target : last >= meta.target)
      : null

    return {
      id,
      title: meta.title,
      target: meta.target,
      direction,
      points,
      last,
      delta,
      improved,
      declined,
      passing,
      hasData: valid.length > 0,
    }
  }).filter(Boolean)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[11px] text-gray-500">
          % across {quarters.length} quarter{quarters.length > 1 ? 's' : ''} · teal dashed line = DOH target
        </p>
        <p className="text-[10px] text-gray-400 font-medium">
          {quarters[0]} → {quarters[quarters.length - 1]}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {series.map(s => (
          <div key={s.id} className="border border-gray-100 rounded-xl p-3 hover:shadow-card transition-all">
            <div className="flex items-start justify-between mb-1">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-navy-500">{s.id}</p>
                <p className="text-[9px] text-gray-500 truncate" title={s.title}>{s.title}</p>
              </div>
              {s.delta != null && s.delta !== 0 ? (
                s.improved ? <TrendingUp size={12} className="text-emerald-500 flex-shrink-0" />
                  : <TrendingDown size={12} className="text-red-500 flex-shrink-0" />
              ) : (
                <Minus size={12} className="text-gray-300 flex-shrink-0" />
              )}
            </div>

            {s.hasData ? (
              <MiniChart points={s.points} target={s.target} direction={s.direction} />
            ) : (
              <div className="h-[70px] flex items-center justify-center">
                <p className="text-[9px] text-gray-400">No data yet</p>
              </div>
            )}

            <div className="flex items-baseline justify-between mt-1">
              <p className={`text-sm font-black ${
                s.passing === true ? 'text-emerald-600' :
                s.passing === false ? 'text-red-500' : 'text-gray-400'
              }`}>
                {s.last != null ? `${s.last}%` : '—'}
              </p>
              <p className="text-[9px] text-gray-400">
                target {s.direction === 'lower' ? '≤' : '≥'}{s.target}%
                {s.delta != null && s.delta !== 0 && (
                  <span className={`ml-1.5 font-bold ${s.improved ? 'text-emerald-600' : 'text-red-500'}`}>
                    {s.delta > 0 ? '+' : ''}{s.delta}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quarter labels strip */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-[9px] text-gray-400 font-medium">
        {quarters.map(q => (
          <span key={q} className={q === currentQuarter ? 'text-navy-500 font-bold' : ''}>{q}</span>
        ))}
      </div>
    </div>
  )
}
