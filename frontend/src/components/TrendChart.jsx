import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const KPI_ORDER = ['OMC001','OMC002','OMC003','OMC004','OMC005','OMC006','OMC007','OMC008']

function MiniChart({ points, target, direction, labels, width = 220, height = 80 }) {
  const padX = 24, padY = 12, bottomPad = 16
  const innerW = width - padX * 2
  const innerH = height - padY - bottomPad

  const xs = points.map((_, i) => points.length === 1
    ? padX + innerW / 2
    : padX + (i * innerW) / (points.length - 1))
  const ys = points.map(p => p == null ? null : padY + innerH - (Math.min(100, Math.max(0, p)) / 100) * innerH)

  // Build path
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
        <>
          <line x1={padX} x2={width - padX} y1={targetY} y2={targetY}
            stroke="#14B8A6" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <text x={width - padX + 3} y={targetY + 3} fontSize="7" fill="#14B8A6" opacity="0.7">{target}%</text>
        </>
      )}
      {/* Trend line */}
      {d && <path d={d} fill="none" stroke="#0D2137" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {/* Dots + value labels */}
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
          <g key={i}>
            <circle cx={x} cy={y} r={isLast ? 3.5 : 2.5}
              fill={fill} stroke="white" strokeWidth={isLast ? 1.5 : 1} />
            {/* Value on hover area — show for first, last, and if only a few points */}
            {(i === 0 || isLast || points.length <= 4) && (
              <text x={x} y={y - 6} textAnchor="middle" fontSize="7" fontWeight="700"
                fill={fill} opacity="0.8">{pct}%</text>
            )}
          </g>
        )
      })}
      {/* Quarter labels along bottom */}
      {labels.map((label, i) => {
        // Show first, last, and every other for many quarters
        const show = i === 0 || i === labels.length - 1 || (labels.length <= 6) || (i % 2 === 0)
        if (!show) return null
        return (
          <text key={i} x={xs[i]} y={height - 2} textAnchor="middle"
            fontSize="7" fill="#9CA3AF" fontWeight="500">{label}</text>
        )
      })}
    </svg>
  )
}

export default function TrendChart({ history, currentQuarter }) {
  if (!history) return null

  const quarters = Object.keys(history).sort()
  if (quarters.length < 2) return null

  // Short labels: "Q2 25" instead of "Q2 2025"
  const shortLabels = quarters.map(q => q.replace(/20(\d{2})/, '$1'))

  const series = KPI_ORDER.map(id => {
    const points = quarters.map(q => {
      const k = history[q]?.kpis?.[id]
      if (!k || k.denominator === 0 || k.status === 'insufficient_data') return null
      return k.percentage
    })
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
    const passing = last != null && meta.target != null
      ? (direction === 'lower' ? last <= meta.target : last >= meta.target)
      : null

    return {
      id, title: meta.title, target: meta.target, direction,
      points, last, delta, improved, passing,
      hasData: valid.length > 0,
    }
  }).filter(Boolean)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      {/* Header with quarter chips */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {quarters.map(q => (
            <span key={q} className={`text-[9px] font-bold px-2 py-0.5 rounded ${
              q === currentQuarter
                ? 'bg-navy-500 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}>{q}</span>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mb-4">
        Each KPI's % across quarters · teal dashed line = DOH target
      </p>

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
              <MiniChart points={s.points} target={s.target} direction={s.direction} labels={shortLabels} />
            ) : (
              <div className="h-[80px] flex items-center justify-center">
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
    </div>
  )
}
