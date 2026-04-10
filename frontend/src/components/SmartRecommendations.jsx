import { useState } from 'react'
import { Lightbulb, ChevronDown, AlertCircle, FileText, Stethoscope,
         ClipboardList, Database, TrendingUp, CheckCircle } from 'lucide-react'

const TYPE_ICONS = {
  clinical: Stethoscope,
  documentation: ClipboardList,
  process: TrendingUp,
  data_gap: Database,
  lab_integration: FileText,
  improvement: AlertCircle,
  maintain: CheckCircle,
}

const PRIORITY_STYLES = {
  high: { bg: 'bg-red-50', border: 'border-red-100', badge: 'bg-red-100 text-red-700', label: 'High Priority' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-100', badge: 'bg-amber-100 text-amber-700', label: 'Medium' },
  low: { bg: 'bg-emerald-50', border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-700', label: 'Maintaining' },
}

export default function SmartRecommendations({ recommendations }) {
  const [expanded, setExpanded] = useState({})

  if (!recommendations || recommendations.length === 0) return null

  const highCount = recommendations.filter(r => r.priority === 'high').length
  const totalImpact = recommendations.reduce((sum, r) => sum + (r.impact || 0), 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-navy-500 to-navy-400 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
            <Lightbulb size={18} className="text-teal-300" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Smart Recommendations</h3>
            <p className="text-navy-200 text-[10px]">
              {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
              {highCount > 0 && <span className="text-red-300 ml-1">· {highCount} high priority</span>}
              {totalImpact > 0 && <span className="text-teal-300 ml-1">· {totalImpact} patients to act on</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {recommendations.map((rec, i) => {
          const style = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.medium
          const Icon = TYPE_ICONS[rec.type] || AlertCircle
          const isExpanded = expanded[i]

          return (
            <div key={i} className={`${isExpanded ? style.bg : 'bg-white'} transition-colors`}>
              <button onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
                className="w-full px-6 py-4 flex items-start gap-4 text-left hover:bg-gray-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${style.bg}`}>
                  <Icon size={14} className={style.badge.split(' ')[1]} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-navy-300">{rec.kpi_id}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${style.badge}`}>{style.label}</span>
                    {rec.impact > 0 && (
                      <span className="text-[8px] font-bold text-navy-400 bg-navy-50 px-1.5 py-0.5 rounded">
                        {rec.impact} patient{rec.impact !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-navy-500">{rec.title}</p>
                </div>
                <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && (
                <div className="px-6 pb-5 pl-[72px] space-y-3 animate-slide-up">
                  <p className="text-xs text-gray-600 leading-relaxed">{rec.description}</p>
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-[10px] font-bold text-navy-500 uppercase tracking-wider mb-1.5">Recommended Action</p>
                    <p className="text-xs text-navy-500 leading-relaxed">{rec.action}</p>
                  </div>
                  {rec.projected_impact && (
                    <div className="flex items-start gap-2 bg-teal-50 rounded-xl p-3 border border-teal-100">
                      <TrendingUp size={13} className="text-teal-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-teal-700 font-medium">{rec.projected_impact}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
