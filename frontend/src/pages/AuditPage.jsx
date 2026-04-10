import { useState, useEffect } from 'react'
import { ArrowLeft, ScrollText, CheckCircle, XCircle, AlertTriangle, Target,
         FileText, Clock, Shield, ChevronDown, ChevronRight, Building,
         CalendarDays, Database, Activity, Printer } from 'lucide-react'
import { api } from '../utils/api'
import { useI18n } from '../utils/i18n'

const KPI_LABELS = {
  OMC001: 'Asthma Medication Ratio',
  OMC002: 'Avoidance of Antibiotics',
  OMC003: 'Time to See Physician',
  OMC004: 'Weight/BMI Counselling',
  OMC005: 'Diabetes HbA1c Control',
  OMC006: 'Blood Pressure Control',
  OMC007: 'Opioid Use Risk',
  OMC008: 'Kidney Disease Evaluation',
}

function AuditEntry({ entry, index }) {
  const [open, setOpen] = useState(index === 0)
  const d = entry.details || {}
  const kpis = d.kpi_results || {}
  const kpiIds = Object.keys(kpis).sort()

  const meeting = Object.values(kpis).filter(k => k.meets_target === true).length
  const failing = Object.values(kpis).filter(k => k.meets_target === false).length
  const nodata = Object.values(kpis).filter(k => k.meets_target === null || k.meets_target === undefined).length

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      open ? 'border-navy-100 shadow-elevated' : 'border-gray-100 shadow-card hover:shadow-elevated'
    }`}>
      {/* Header — always visible */}
      <button onClick={() => setOpen(!open)} className="w-full px-6 py-5 flex items-center gap-5 text-left">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            d.verdict === 'ready' ? 'bg-emerald-50' :
            d.verdict === 'attention' ? 'bg-amber-50' : 'bg-red-50'
          }`}>
            {d.verdict === 'ready' ? <CheckCircle size={22} className="text-emerald-500" /> :
             d.verdict === 'attention' ? <AlertTriangle size={22} className="text-amber-500" /> :
             <XCircle size={22} className="text-red-400" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-black text-navy-500">{entry.quarter || 'Unknown'}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              d.verdict === 'ready' ? 'bg-emerald-50 text-emerald-700' :
              d.verdict === 'attention' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
            }`}>
              {d.verdict === 'ready' ? 'Ready' : d.verdict === 'attention' ? 'Needs Attention' : 'Not Ready'}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {d.total_records?.toLocaleString()} records · {d.files_used?.join(', ')} · {meeting}/{d.calculable || 0} meeting target
          </p>
        </div>
        <div className="text-right flex-shrink-0 hidden sm:block">
          <div className="text-xs text-gray-500 font-medium">
            {entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
          </div>
          <div className="text-[10px] text-gray-400">
            {entry.created_at ? new Date(entry.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Detail — expandable */}
      {open && (
        <div className="px-6 pb-6 animate-slide-up">
          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-navy-50/40 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays size={12} className="text-navy-400" />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Quarter</span>
              </div>
              <p className="text-sm font-bold text-navy-500">{entry.quarter}</p>
            </div>
            <div className="bg-navy-50/40 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Database size={12} className="text-navy-400" />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Records</span>
              </div>
              <p className="text-sm font-bold text-navy-500">{d.total_records?.toLocaleString() || '—'}</p>
            </div>
            <div className="bg-navy-50/40 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={12} className="text-navy-400" />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Data Sources</span>
              </div>
              <p className="text-sm font-bold text-navy-500">{d.files_used?.length || 0} files</p>
            </div>
            <div className="bg-navy-50/40 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={12} className="text-navy-400" />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Calculated</span>
              </div>
              <p className="text-sm font-bold text-navy-500">
                {entry.created_at ? new Date(entry.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
          </div>

          {/* KPI Results Table */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-navy-500 text-white">
                  <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">KPI</th>
                  <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider">Indicator</th>
                  <th className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-wider">Num</th>
                  <th className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-wider">Den</th>
                  <th className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-wider">Rate</th>
                  <th className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-wider">Target</th>
                  <th className="px-4 py-3 text-center font-bold text-[10px] uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody>
                {kpiIds.map((id, i) => {
                  const k = kpis[id]
                  return (
                    <tr key={id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 font-black text-navy-500">{id}</td>
                      <td className="px-4 py-3 text-gray-600 font-medium">{KPI_LABELS[id] || id}</td>
                      <td className="px-4 py-3 text-center font-bold text-navy-500">{k.numerator}</td>
                      <td className="px-4 py-3 text-center font-bold text-navy-500">{k.denominator}</td>
                      <td className="px-4 py-3 text-center font-bold text-navy-500">
                        {k.denominator > 0 ? `${k.percentage}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          k.status === 'calculated' ? 'bg-teal-50 text-teal-700' :
                          k.status === 'proxy' ? 'bg-amber-50 text-amber-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>{k.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 font-medium">
                        {k.meets_target !== null && k.meets_target !== undefined ? `≥${k.percentage > 0 ? '' : ''}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {k.meets_target === true ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <CheckCircle size={11} /> PASS
                          </span>
                        ) : k.meets_target === false ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                            <XCircle size={11} /> FAIL
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Traceability footer */}
          <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400">
            <span>Calculation ID: {entry.id || '—'}</span>
            <span>Engine: DOH Jawda V2 2026</span>
            <span>User: {entry.user_email || 'system'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AuditPage({ facility, onBack }) {
  const { t } = useI18n()
  const [entries, setEntries] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (facility) {
      api.getAuditLog(facility)
        .then(data => setEntries(data.entries || []))
        .catch(() => setEntries([]))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
      setEntries([])
    }
  }, [facility])

  function handlePrint() {
    window.print()
  }

  // Stats
  const totalCalcs = entries?.length || 0
  const quarters = [...new Set(entries?.map(e => e.quarter).filter(Boolean) || [])]
  const latestVerdict = entries?.[0]?.details?.verdict

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <ScrollText size={16} className="text-indigo-500" />
          <span className="text-sm font-bold text-navy-500">{t('audit.title')}</span>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-2 text-xs px-3 py-2 bg-gray-50 hover:bg-gray-100
            rounded-lg text-gray-600 hover:text-navy-500 font-medium transition-all border border-gray-200">
          <Printer size={13} /> Print Audit Report
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl flex items-center justify-center shadow-card">
              <ScrollText size={24} className="text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy-500 tracking-tight">{t('audit.title')}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Complete traceability for DOH Jawda Data Certification (JDC) compliance
              </p>
            </div>
          </div>

          {/* Facility info bar */}
          <div className="bg-gradient-to-r from-navy-500 to-navy-400 rounded-2xl p-6 text-white">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Building size={13} className="text-teal-300" />
                  <span className="text-[10px] text-navy-200 font-bold uppercase tracking-wider">Facility</span>
                </div>
                <p className="text-sm font-bold">{facility || 'All Facilities'}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Activity size={13} className="text-teal-300" />
                  <span className="text-[10px] text-navy-200 font-bold uppercase tracking-wider">Calculations</span>
                </div>
                <p className="text-sm font-bold">{totalCalcs}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <CalendarDays size={13} className="text-teal-300" />
                  <span className="text-[10px] text-navy-200 font-bold uppercase tracking-wider">Quarters Covered</span>
                </div>
                <p className="text-sm font-bold">{quarters.join(', ') || '—'}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield size={13} className="text-teal-300" />
                  <span className="text-[10px] text-navy-200 font-bold uppercase tracking-wider">Latest Status</span>
                </div>
                <p className={`text-sm font-bold ${
                  latestVerdict === 'ready' ? 'text-emerald-300' :
                  latestVerdict === 'attention' ? 'text-amber-300' : 'text-red-300'
                }`}>
                  {latestVerdict === 'ready' ? 'Ready for Submission' :
                   latestVerdict === 'attention' ? 'Needs Attention' :
                   latestVerdict === 'not_ready' ? 'Not Ready' : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance notice */}
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50/50 border border-indigo-100/60 rounded-2xl p-5 mb-8 flex gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <Shield size={18} className="text-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-800">DOH Jawda Data Certification (JDC) Compliance</p>
            <p className="text-xs text-indigo-700/70 mt-1 leading-relaxed">
              This audit trail provides complete traceability from source data to KPI results as required by DOH JDC methodology.
              Each entry records: data sources used, records processed, column mappings applied, calculation methodology (DOH Jawda Guidance V2 2026),
              and per-KPI results with pass/fail against official targets.
            </p>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-navy-200 border-t-navy-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-500 ml-3">Loading audit history...</span>
          </div>
        ) : entries && entries.length === 0 ? (
          <div className="text-center py-20">
            <ScrollText size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-sm text-gray-500 font-medium">No audit history yet</p>
            <p className="text-xs text-gray-400 mt-1">Upload and calculate KPIs to start building your audit trail.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-navy-500 uppercase tracking-wider">
                Calculation History ({entries?.length} entries)
              </h2>
              <span className="text-[10px] text-gray-400 font-medium">Most recent first</span>
            </div>

            {/* Timeline line */}
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-200 via-gray-200 to-transparent" />

              <div className="space-y-4 relative">
                {entries?.map((entry, i) => (
                  <div key={entry.id || i} className="ml-12 relative">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[33px] top-6 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                      entry.details?.verdict === 'ready' ? 'bg-emerald-500' :
                      entry.details?.verdict === 'attention' ? 'bg-amber-400' : 'bg-red-400'
                    }`} />
                    <AuditEntry entry={entry} index={i} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-14 text-center pb-8">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-auto mb-4" />
          <p className="text-[11px] text-gray-400 font-medium">
            Jawda KPI Platform by TriZodiac — Audit Trail generated for DOH JDC compliance
          </p>
          <p className="text-[10px] text-gray-300 mt-1">
            DOH Outpatient Medical Centers Jawda Guidance V2 2026 · ADHICS Compliant · UAE North
          </p>
        </div>
      </div>
    </div>
  )
}
