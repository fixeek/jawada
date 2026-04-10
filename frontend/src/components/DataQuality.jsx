import { CheckCircle, AlertCircle, XCircle, MinusCircle, AlertTriangle } from 'lucide-react'

const STATUS_COLOR = {
  good:    { bar: 'bg-gradient-to-r from-emerald-400 to-green-400', text: 'text-emerald-700', label: 'Good',      icon: CheckCircle,  iconColor: 'text-emerald-500', bg: 'bg-emerald-50' },
  partial: { bar: 'bg-gradient-to-r from-amber-400 to-orange-300',  text: 'text-amber-700',   label: 'Partial',   icon: AlertCircle,  iconColor: 'text-amber-500',   bg: 'bg-amber-50' },
  poor:    { bar: 'bg-gradient-to-r from-red-400 to-rose-400',      text: 'text-red-600',     label: 'Poor',      icon: XCircle,      iconColor: 'text-red-400',     bg: 'bg-red-50' },
  missing: { bar: 'bg-gray-200',                                     text: 'text-gray-400',    label: 'Not found', icon: MinusCircle,  iconColor: 'text-gray-400',    bg: 'bg-gray-50' },
}

const KPI_LABELS = {
  OMC001: 'Asthma Medication Ratio',
  OMC002: 'Avoidance of Antibiotics',
  OMC003: 'Time to See Physician',
  OMC004: 'Weight/BMI Counselling',
  OMC005: 'Diabetes HbA1c Control',
  OMC006: 'Blood Pressure Control',
  OMC007: 'Opioid Use Risk',
  OMC008: 'Kidney Disease Eval',
}

export default function DataQuality({ quality }) {
  if (!quality) return null
  const fields = Object.entries(quality.fields)
  const readiness = quality.kpi_readiness || {}

  const counts = { good: 0, partial: 0, poor: 0, missing: 0 }
  fields.forEach(([, f]) => counts[f.status]++)

  // Use backend-computed score (average of actual populated percentages)
  const score = Math.round(quality.overall_score ?? 0)
  const scoreColor = score >= 70 ? 'from-emerald-500 to-green-500' : score >= 40 ? 'from-amber-400 to-orange-400' : 'from-red-500 to-rose-500'

  const readyCount = Object.values(readiness).filter(r => r.ready).length
  const totalKpis = Object.keys(readiness).length

  return (
    <div className="space-y-5">

      {/* KPI Readiness */}
      {totalKpis > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-bold text-navy-500 text-sm">KPI Data Readiness</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Can each KPI be calculated from the uploaded data?
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-black tracking-tight ${readyCount === totalKpis ? 'text-emerald-600' : readyCount >= 4 ? 'text-amber-600' : 'text-red-500'}`}>
                {readyCount}/{totalKpis}
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Can Calculate</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(readiness).map(([kpiId, info]) => (
              <div key={kpiId} className={`rounded-xl p-3 border transition-colors ${
                info.ready
                  ? 'bg-emerald-50/50 border-emerald-100/60'
                  : 'bg-red-50/30 border-red-100/40'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black text-navy-400 tracking-wider">{kpiId}</span>
                  {info.ready
                    ? <CheckCircle size={14} className="text-emerald-500" />
                    : <XCircle size={14} className="text-red-400" />
                  }
                </div>
                <p className="text-[10px] text-gray-500 font-semibold leading-snug mb-2 min-h-[24px]">
                  {KPI_LABELS[kpiId] || kpiId}
                </p>
                {info.critical_missing?.length > 0 && (
                  <div className="space-y-0.5">
                    {info.critical_missing.map(f => (
                      <p key={f} className="text-[9px] text-red-500 font-semibold truncate">Needs: {f}</p>
                    ))}
                  </div>
                )}
                {info.ready && info.optional_missing?.length > 0 && (
                  <div className="space-y-0.5">
                    {info.optional_missing.map(f => (
                      <p key={f} className="text-[9px] text-amber-500 font-semibold truncate">Optional: {f}</p>
                    ))}
                  </div>
                )}
                {info.ready && (!info.optional_missing || info.optional_missing.length === 0) && (
                  <p className="text-[9px] text-emerald-600 font-semibold">All fields present</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field-level data quality */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-bold text-navy-500 text-sm">Data Completeness</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {(quality.total_rows || 0).toLocaleString()} records — percentage of rows with each field populated
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-black bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent tracking-tight`}>
                {score}%
              </div>
              <div className="text-[10px] text-gray-500 font-bold mt-0.5 uppercase tracking-wider">Avg Completeness</div>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex gap-2 mb-6">
            {Object.entries(counts).filter(([, c]) => c > 0).map(([status, count]) => {
              const cfg = STATUS_COLOR[status]
              return (
                <div key={status} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold ${cfg.bg} border border-gray-100/50`}>
                  <div className={`w-2 h-2 rounded-full ${cfg.bar}`} />
                  <span className="text-gray-700">{count} {cfg.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Field breakdown */}
        <div className="px-3 pb-3">
          {fields.map(([name, info]) => {
            const cfg = STATUS_COLOR[info.status]
            const Icon = cfg.icon
            return (
              <div key={name} className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-navy-50/30 transition-colors">
                <div className={`w-7 h-7 ${cfg.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon size={13} className={cfg.iconColor} />
                </div>
                <div className="w-28 text-xs text-navy-500 font-bold flex-shrink-0 truncate">{name}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full ${cfg.bar}`}
                    style={{ width: `${info.populated_pct}%`, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
                <div className={`w-20 text-xs font-bold text-right ${cfg.text}`}>
                  {info.status === 'missing' ? 'Not found' : `${info.populated_pct}%`}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
