import { CheckCircle, Clock, AlertTriangle, XCircle, Send, CalendarDays } from 'lucide-react'

/* ── Compliance Calendar ─────────────────────────────────────────────────────
   Visual year grid showing all quarters with DOH deadlines, submission
   status, and readiness verdict. Shows 2 years at a glance so clinics
   can see their full submission history and upcoming deadlines.        ── */

const STATUS_CONFIG = {
  accepted:     { icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Accepted by DOH' },
  submitted:    { icon: Send,          color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-200',    label: 'Submitted' },
  approved:     { icon: CheckCircle,   color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200',  label: 'Approved' },
  under_review: { icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Under Review' },
  calculated:   { icon: CalendarDays,  color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    label: 'Calculated' },
}

const VERDICT_DOT = {
  ready: 'bg-emerald-400',
  attention: 'bg-amber-400',
  not_ready: 'bg-red-400',
}

// DOH submission deadlines: Q1 data → Apr 30, Q2 → Jul 31, Q3 → Oct 31, Q4 → Jan 31 next year
function getDeadline(q, year) {
  const map = { 1: { m: 3, d: 30 }, 2: { m: 6, d: 31 }, 3: { m: 9, d: 31 }, 4: { m: 0, d: 31, ny: true } }
  const cfg = map[q]
  if (!cfg) return null
  return new Date(cfg.ny ? year + 1 : year, cfg.m, cfg.d)
}

export default function ComplianceCalendar({ history, onSelectQuarter }) {
  const now = new Date()
  const currentYear = now.getFullYear()

  // Determine years to show: current year + any year that has data
  const dataYears = new Set()
  if (history) {
    for (const q of Object.keys(history)) {
      const match = q.match(/Q\d\s+(\d{4})/)
      if (match) dataYears.add(parseInt(match[1]))
    }
  }
  dataYears.add(currentYear)
  dataYears.add(currentYear - 1)
  const years = [...dataYears].sort()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      {years.map(year => (
        <div key={year} className="mb-5 last:mb-0">
          <h4 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-3">{year}</h4>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(q => {
              const qLabel = `Q${q} ${year}`
              const qData = history?.[qLabel]
              const submission = qData?.submission
              const verdict = qData?.jawda_summary?.verdict
              const meeting = qData?.jawda_summary?.meeting_target
              const calculable = qData?.jawda_summary?.calculable
              const deadline = getDeadline(q, year)
              const isPast = deadline && deadline < now
              const isUpcoming = deadline && !isPast && (deadline - now) < 30 * 24 * 60 * 60 * 1000
              const statusCfg = submission ? STATUS_CONFIG[submission.status] : null
              const hasData = !!qData?.kpis && Object.keys(qData.kpis).length > 0

              return (
                <button key={qLabel}
                  onClick={() => hasData && onSelectQuarter?.(qLabel)}
                  disabled={!hasData}
                  className={`rounded-xl p-3 text-left transition-all border ${
                    hasData
                      ? 'hover:shadow-card cursor-pointer border-gray-100'
                      : 'opacity-60 cursor-default border-gray-50 bg-gray-50/30'
                  }`}
                >
                  {/* Quarter label + verdict dot */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-navy-500">Q{q}</span>
                    {verdict && (
                      <div className={`w-2.5 h-2.5 rounded-full ${VERDICT_DOT[verdict] || 'bg-gray-300'}`}
                        title={verdict} />
                    )}
                  </div>

                  {/* Score */}
                  {hasData ? (
                    <div className="text-xs text-gray-600 font-medium mb-1.5">
                      {meeting}/{8 - (qData?.jawda_summary?.not_applicable || 0)} passing
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-400 mb-1.5">No data</div>
                  )}

                  {/* Submission status badge */}
                  {statusCfg ? (
                    <div className={`flex items-center gap-1 text-[9px] font-bold ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border} border rounded px-1.5 py-0.5 w-fit`}>
                      <statusCfg.icon size={9} />
                      {statusCfg.label}
                    </div>
                  ) : hasData ? (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 w-fit">
                      <Clock size={9} />
                      Pending
                    </div>
                  ) : null}

                  {/* Deadline */}
                  {deadline && (
                    <div className={`text-[8px] mt-1.5 font-medium ${
                      isUpcoming ? 'text-amber-600' :
                      isPast && !hasData ? 'text-red-500' :
                      'text-gray-400'
                    }`}>
                      Due {deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {isUpcoming && ' (soon)'}
                      {isPast && !hasData && ' (overdue)'}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
