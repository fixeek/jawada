import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'

export default function PredictionBanner({ predictions }) {
  if (!predictions || predictions.length === 0) return null

  const declining = predictions.filter(p => p.type === 'declining' || p.type === 'worsening')
  const improving = predictions.filter(p => p.type === 'improving')

  if (declining.length === 0 && improving.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {declining.map((p, i) => (
        <div key={i} className="flex items-start gap-4 bg-red-50 border border-red-100 rounded-2xl p-4">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded">{p.kpi_id}</span>
              <span className="text-[9px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">PREDICTION</span>
            </div>
            <p className="text-xs font-bold text-red-800">{p.title}</p>
            <p className="text-[11px] text-red-700/80 mt-0.5">{p.description}</p>
          </div>
        </div>
      ))}
      {improving.map((p, i) => (
        <div key={i} className="flex items-start gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{p.kpi_id}</span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">PREDICTION</span>
            </div>
            <p className="text-xs font-bold text-emerald-800">{p.title}</p>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">{p.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
