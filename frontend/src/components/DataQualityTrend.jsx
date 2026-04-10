import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function DataQualityTrend({ history }) {
  if (!history) return null

  const quarters = Object.keys(history).sort()
  if (quarters.length < 2) return null

  // Extract data quality scores per quarter
  const scores = quarters.map(q => {
    const dq = history[q]?.data_quality
    return {
      quarter: q,
      score: dq?.overall_score || 0,
    }
  }).filter(s => s.score > 0)

  if (scores.length < 2) return null

  const first = scores[0].score
  const last = scores[scores.length - 1].score
  const delta = Math.round(last - first)
  const improving = delta > 0
  const declining = delta < 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg flex items-center justify-center">
            <Activity size={14} className="text-teal-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-500">Data Quality Trend</h3>
            <p className="text-[10px] text-gray-500">Field completeness across quarters</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold ${
          improving ? 'text-emerald-600' : declining ? 'text-red-500' : 'text-gray-400'
        }`}>
          {improving ? <TrendingUp size={14} /> : declining ? <TrendingDown size={14} /> : <Minus size={14} />}
          {delta > 0 ? '+' : ''}{delta}%
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-3 h-24">
        {scores.map((s, i) => (
          <div key={s.quarter} className="flex-1 flex flex-col items-center">
            <span className="text-[9px] font-bold text-navy-500 mb-1">{s.score}%</span>
            <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '80px' }}>
              <div className={`absolute bottom-0 left-0 right-0 rounded-t transition-all ${
                s.score >= 70 ? 'bg-gradient-to-t from-emerald-400 to-emerald-300' :
                s.score >= 40 ? 'bg-gradient-to-t from-amber-400 to-amber-300' :
                'bg-gradient-to-t from-red-400 to-red-300'
              }`} style={{ height: `${s.score}%` }} />
            </div>
            <span className="text-[8px] text-gray-400 font-medium mt-1">{s.quarter.replace(/20(\d{2})/, '$1')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
