import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, Building, Activity,
         FileBarChart, Layers, Target, ChevronDown, ShieldCheck, ShieldAlert, ShieldX,
         ClipboardList, ArrowRight, Printer, Copy, ExternalLink, TrendingUp, TrendingDown, Minus,
         ScrollText } from 'lucide-react'
import { api } from '../utils/api'
import KPICard from '../components/KPICard'
import KPIModal from '../components/KPIModal'
import DataQuality from '../components/DataQuality'
import PrintReport from '../components/PrintReport'

/* ── Readiness Verdict ─────────────────────────────────────────────────────── */

function ReadinessVerdict({ summary, results }) {
  if (!summary) return null
  const { meeting_target, below_target, missing_data, calculable, readiness_pct, verdict } = summary

  const cfg = {
    ready:     { icon: ShieldCheck, color: 'text-emerald-700', bg: 'from-emerald-50 to-green-50/50', border: 'border-emerald-100',
                 headline: 'Ready for Jawda Submission', sub: 'All calculable KPIs meet DOH targets.' },
    attention: { icon: ShieldAlert, color: 'text-amber-700',   bg: 'from-amber-50 to-orange-50/30',  border: 'border-amber-100',
                 headline: `${below_target + missing_data} KPI${below_target + missing_data > 1 ? 's' : ''} need attention before submission`,
                 sub: `${meeting_target} of ${calculable} calculable KPIs meet DOH targets. ${missing_data > 0 ? `${missing_data} cannot be calculated yet.` : ''}` },
    not_ready: { icon: ShieldX,     color: 'text-red-600',     bg: 'from-red-50 to-rose-50/30',      border: 'border-red-100',
                 headline: 'Not ready for Jawda submission',
                 sub: `${missing_data} KPIs cannot be calculated. Review the action plan below.` },
  }[verdict] || cfg?.attention

  const Icon = cfg.icon

  return (
    <div className={`bg-gradient-to-r ${cfg.bg} border ${cfg.border} rounded-2xl p-6 mb-8`}>
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-card flex-shrink-0">
          <Icon size={28} className={cfg.color} />
        </div>
        <div className="flex-1">
          <h2 className={`text-lg font-black ${cfg.color} tracking-tight`}>{cfg.headline}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{cfg.sub}</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className={`text-4xl font-black ${cfg.color} tracking-tight`}>{calculable > 0 ? `${readiness_pct}%` : '—'}</div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
            {meeting_target}/{calculable} meeting target
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Summary Cards ─────────────────────────────────────────────────────────── */

function SummaryBar({ kpis }) {
  const vals = Object.values(kpis)
  const meeting = vals.filter(k => k.meets_target === true).length
  const below   = vals.filter(k => k.meets_target === false).length
  const proxy   = vals.filter(k => k.status === 'proxy').length
  const missing = vals.filter(k => k.status === 'insufficient_data').length
  const items = [
    { count: meeting, label: 'Meeting Target',  icon: CheckCircle,   bg: 'bg-emerald-50', numColor: 'text-emerald-700' },
    { count: below,   label: 'Below Target',    icon: Target,        bg: 'bg-red-50',     numColor: 'text-red-600' },
    { count: proxy,   label: 'Proxy Data',      icon: AlertTriangle, bg: 'bg-amber-50',   numColor: 'text-amber-700' },
    { count: missing, label: 'Cannot Calculate', icon: XCircle,      bg: 'bg-gray-50',    numColor: 'text-gray-500' },
  ]
  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map(({ count, label, icon: Icon, bg, numColor }) => (
        <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-3xl font-black ${numColor} tracking-tight`}>{count}</div>
              <div className="text-[10px] text-gray-500 font-semibold mt-1">{label}</div>
            </div>
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon size={18} className={numColor} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Jawda Portal View ─────────────────────────────────────────────────────── */

function JawdaPortalView({ kpis, facility, quarter }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(null)
  const entries = Object.entries(kpis).filter(([id]) => !id.startsWith('ERROR'))

  function copyValue(text, id) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  function copyAll() {
    const lines = entries.map(([id, k]) => `${id}\t${k.numerator}\t${k.denominator}`).join('\n')
    navigator.clipboard.writeText(`KPI\tNumerator\tDenominator\n${lines}`)
    setCopied('all')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="mb-8">
      <button onClick={() => setOpen(!open)} className="w-full">
        <div className="bg-gradient-to-r from-navy-500 to-navy-400 rounded-2xl p-5 flex items-center justify-between
          hover:from-navy-400 hover:to-navy-500 transition-all cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <ExternalLink size={18} className="text-teal-300" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-bold text-sm">Copy to Jawda Portal</h3>
              <p className="text-white/50 text-xs mt-0.5">
                Numerator & denominator values ready to enter at bpmweb.doh.gov.ae
              </p>
            </div>
          </div>
          <ChevronDown size={18} className={`text-navy-300 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden animate-slide-up">
          <div className="p-5 pb-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              <span className="font-bold text-navy-500">{facility}</span> — {quarter}
            </p>
            <button onClick={copyAll}
              className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg transition-colors">
              <Copy size={11} />
              {copied === 'all' ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-navy-50/50">
                <th className="px-5 py-2.5 text-left text-navy-400 font-bold text-[10px] uppercase tracking-wider">KPI ID</th>
                <th className="px-5 py-2.5 text-left text-navy-400 font-bold text-[10px] uppercase tracking-wider">Title</th>
                <th className="px-5 py-2.5 text-center text-navy-400 font-bold text-[10px] uppercase tracking-wider">Numerator</th>
                <th className="px-5 py-2.5 text-center text-navy-400 font-bold text-[10px] uppercase tracking-wider">Denominator</th>
                <th className="px-5 py-2.5 text-center text-navy-400 font-bold text-[10px] uppercase tracking-wider">Rate</th>
                <th className="px-5 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([id, k], i) => {
                const isInsufficient = k.status === 'insufficient_data'
                return (
                  <tr key={id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-teal-50/30 transition-colors`}>
                    <td className="px-5 py-3 font-black text-navy-500">{id}</td>
                    <td className="px-5 py-3 text-gray-600 font-medium">{k.title}</td>
                    <td className={`px-5 py-3 text-center font-bold ${isInsufficient ? 'text-gray-400' : 'text-navy-500 text-base'}`}>
                      {isInsufficient ? '—' : k.numerator}
                    </td>
                    <td className={`px-5 py-3 text-center font-bold ${isInsufficient ? 'text-gray-400' : 'text-navy-500 text-base'}`}>
                      {isInsufficient ? '—' : k.denominator}
                    </td>
                    <td className={`px-5 py-3 text-center font-bold ${
                      k.meets_target === true ? 'text-emerald-600' : k.meets_target === false ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {k.denominator > 0 ? `${k.percentage}%` : '—'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {!isInsufficient && (
                        <button onClick={() => copyValue(`${k.numerator}\t${k.denominator}`, id)}
                          className="text-gray-400 hover:text-teal-500 transition-colors">
                          {copied === id
                            ? <CheckCircle size={14} className="text-teal-500" />
                            : <Copy size={14} />
                          }
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 bg-navy-50/30 border-t border-gray-100 flex items-center gap-2">
            <ExternalLink size={12} className="text-gray-500" />
            <p className="text-[10px] text-gray-500">
              Submit at <span className="font-bold text-navy-500">bpmweb.doh.gov.ae</span> — Jawda e-notification system
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Quarter Comparison ────────────────────────────────────────────────────── */

function QuarterComparison({ currentQ, currentKpis, prevQ, prevData }) {
  if (!prevData || !prevQ) return null
  const kpiIds = ['OMC001','OMC002','OMC003','OMC004','OMC005','OMC006','OMC007','OMC008']

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg flex items-center justify-center">
          <TrendingUp size={14} className="text-teal-500" />
        </div>
        <h2 className="text-sm font-bold text-navy-500 tracking-tight">Quarter Comparison — {prevQ} vs {currentQ}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-1" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-navy-50/50">
              <th className="px-5 py-3 text-left text-navy-400 font-bold text-[10px] uppercase tracking-wider">KPI</th>
              <th className="px-5 py-3 text-left text-navy-400 font-bold text-[10px] uppercase tracking-wider">Title</th>
              <th className="px-5 py-3 text-center text-navy-400 font-bold text-[10px] uppercase tracking-wider">{prevQ}</th>
              <th className="px-5 py-3 text-center text-navy-400 font-bold text-[10px] uppercase tracking-wider">{currentQ}</th>
              <th className="px-5 py-3 text-center text-navy-400 font-bold text-[10px] uppercase tracking-wider">Change</th>
              <th className="px-5 py-3 text-center text-navy-400 font-bold text-[10px] uppercase tracking-wider">Trend</th>
            </tr>
          </thead>
          <tbody>
            {kpiIds.map((id, i) => {
              const curr = currentKpis[id]
              const prev = prevData.kpis?.[id]
              if (!curr) return null

              const currPct = curr.denominator > 0 ? curr.percentage : null
              const prevPct = prev?.denominator > 0 ? prev.percentage : null
              const diff = currPct !== null && prevPct !== null ? Math.round((currPct - prevPct) * 10) / 10 : null
              const direction = curr.target_direction || 'higher'
              const improved = diff !== null && diff !== 0 && (direction === 'lower' ? diff < 0 : diff > 0)
              const declined = diff !== null && diff !== 0 && !improved

              return (
                <tr key={id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-teal-50/20 transition-colors`}>
                  <td className="px-5 py-3 font-black text-navy-500">{id}</td>
                  <td className="px-5 py-3 text-gray-600 font-medium">{curr.title}</td>
                  <td className="px-5 py-3 text-center font-bold text-gray-500">
                    {prevPct !== null ? `${prevPct}%` : '—'}
                    {prev && <span className="text-gray-400 font-normal ml-1 text-[9px]">({prev.numerator}/{prev.denominator})</span>}
                  </td>
                  <td className={`px-5 py-3 text-center font-bold ${
                    curr.meets_target === true ? 'text-emerald-600' :
                    curr.meets_target === false ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {currPct !== null ? `${currPct}%` : '—'}
                    <span className="text-gray-400 font-normal ml-1 text-[9px]">({curr.numerator}/{curr.denominator})</span>
                  </td>
                  <td className={`px-5 py-3 text-center font-bold ${
                    diff === null || diff === 0 ? 'text-gray-400' :
                    improved ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {diff === null ? '—' : diff > 0 ? `+${diff}%` : `${diff}%`}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {diff === null ? (
                      <Minus size={14} className="text-gray-300 mx-auto" />
                    ) : diff === 0 ? (
                      <Minus size={14} className="text-gray-400 mx-auto" />
                    ) : improved ? (
                      <TrendingUp size={14} className="text-emerald-500 mx-auto" />
                    ) : (
                      <TrendingDown size={14} className="text-red-500 mx-auto" />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Summary row */}
        <div className="px-5 py-3 bg-navy-50/30 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">
            {prevQ}: {prevData.jawda_summary?.meeting_target || 0}/{prevData.jawda_summary?.calculable || 0} meeting target
          </span>
          <span className="text-navy-500 font-bold">
            {currentQ}: {currentKpis ? Object.values(currentKpis).filter(k => k.meets_target === true).length : 0}/{Object.values(currentKpis).filter(k => k.status !== 'insufficient_data').length} meeting target
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Action Plan ───────────────────────────────────────────────────────────── */

const ACTION_FIXES = {
  OMC001: 'Add a drug_name column to your HIS export with medication names. Your pharmacy team can export this from their dispensing system.',
  OMC002: 'Include prescription data in your HIS export. The engine needs drug names within 3 days of each bronchitis visit.',
  OMC003: 'Set up your check-in app to capture registration + consult-start timestamps and pass them to Malaffi.',
  OMC004: 'Add a management_plan field to your physician screen. Doctors need to document BMI counselling plans for patients with BMI >= 25.',
  OMC005: 'Integrate HbA1c lab results (CPT 83036) into your HIS export. Contact your lab system vendor for the data feed.',
  OMC006: 'Ensure hypertension patients have confirmed ICD codes (I10-I13) in their records for official scoring.',
  OMC007: 'Add days_supplied to your pharmacy export so the engine can calculate 15/30 and 31/62 day thresholds accurately.',
  OMC008: 'Integrate eGFR and uACR lab results into your HIS export. Contact your lab vendor for the data feed.',
}

function ActionPlan({ kpis }) {
  const [open, setOpen] = useState(true)
  const entries = Object.entries(kpis).filter(([id]) => !id.startsWith('ERROR'))

  const blocked = entries.filter(([, k]) => k.status === 'insufficient_data')
  const belowTarget = entries.filter(([, k]) => k.meets_target === false)
  const proxyOk = entries.filter(([, k]) => k.status === 'proxy' && k.meets_target !== false)

  const totalActions = blocked.length + belowTarget.length + proxyOk.length
  if (totalActions === 0) return null

  return (
    <div className="mt-8">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 mb-5 w-full group">
        <div className="w-8 h-8 bg-gradient-to-br from-red-50 to-amber-50 rounded-lg flex items-center justify-center">
          <ClipboardList size={14} className="text-red-500" />
        </div>
        <h2 className="text-sm font-bold text-navy-500 tracking-tight">Action Plan to Pass Jawda</h2>
        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
          {totalActions} action{totalActions > 1 ? 's' : ''} required
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-1" />
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && <div className="space-y-3 animate-slide-up">
        {/* Priority 1: Cannot calculate */}
        {blocked.map(([id, k]) => (
          <div key={id} className="bg-white border border-red-100 rounded-xl p-5 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <XCircle size={16} className="text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase tracking-wider">Cannot Calculate</span>
                  <span className="text-xs font-bold text-navy-500">{id} — {k.title}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Missing: {(k.missing_fields || []).join(', ')}
                </p>
                <div className="flex items-start gap-2 bg-navy-50/40 rounded-lg p-3">
                  <ArrowRight size={12} className="text-teal-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-navy-500 font-medium">{ACTION_FIXES[id] || 'Contact your IT team to add the missing data fields.'}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Priority 2: Below target */}
        {belowTarget.map(([id, k]) => (
          <div key={id} className="bg-white border border-amber-100 rounded-xl p-5 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target size={16} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">Below Target</span>
                  <span className="text-xs font-bold text-navy-500">{id} — {k.title}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Current: <strong>{k.percentage}%</strong> — Target: <strong>
                  {k.target_direction === 'lower' ? '≤' : '≥'} {k.target}%</strong>
                  {k.gap_patients > 0 && <span> — gap of <strong>{k.gap_patients} patient{k.gap_patients > 1 ? 's' : ''}</strong></span>}
                </p>
                {k.gap_patients > 0 && (
                  <div className="flex items-start gap-2 bg-navy-50/40 rounded-lg p-3">
                    <ArrowRight size={12} className="text-teal-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-navy-500 font-medium">
                      {k.target_direction === 'lower'
                        ? `Reduce ${k.gap_patients} patient${k.gap_patients > 1 ? 's' : ''} from risk threshold to reach ≤${k.target}% target.`
                        : `${k.gap_patients} more patient${k.gap_patients > 1 ? 's' : ''} need to meet criteria to reach ≥${k.target}% target. Review the patient list in the ${id} detail view.`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Priority 3: Proxy data — passing but unofficial */}
        {proxyOk.map(([id, k]) => (
          <div key={id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={14} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-navy-500">{id} — using proxy data. </span>
                <span className="text-xs text-gray-600">
                  Result is {k.percentage}% but based on incomplete data. For official submission, add: {(k.missing_fields || []).join(', ') || 'complete data fields'}.
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>}
    </div>
  )
}

/* ── Export Buttons ─────────────────────────────────────────────────────────── */

function ExportButtons({ results, onPrint }) {
  function exportAnalysis() {
    const rows = [['KPI ID','Title','Numerator','Denominator','Percentage','DOH Target','Pass/Fail','Status','Missing Fields']]
    Object.entries(results.kpis).forEach(([id, k]) => {
      const passFail = k.meets_target === true ? 'PASS' : k.meets_target === false ? 'FAIL' : 'N/A'
      rows.push([id, k.title, k.numerator, k.denominator, k.percentage,
        `${k.target_direction === 'lower' ? '<=' : '>='}${k.target}%`,
        passFail, k.status, (k.missing_fields||[]).join('; ')])
    })
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `jawda-kpis-${results.quarter?.replace(' ','-')}-${results.facility}.csv`
    a.click()
  }

  function exportSubmission() {
    const header = [
      `Facility: ${results.facility}`,
      `Quarter: ${results.quarter}`,
      `Generated: ${new Date().toLocaleDateString('en-GB')}`,
      `DOH Jawda Guidance: v1.4`,
      `Total Records: ${results.total_records}`,
      '',
    ]
    const table = [['KPI ID','KPI Title','Domain','Direction','Numerator','Denominator','Rate (%)','DOH Target (%)','Status','Pass/Fail']]
    Object.entries(results.kpis).forEach(([id, k]) => {
      const passFail = k.meets_target === true ? 'PASS' : k.meets_target === false ? 'FAIL' : 'INSUFFICIENT DATA'
      table.push([id, k.title, k.domain || '', k.target_direction || '', k.numerator, k.denominator,
        k.percentage, k.target, k.status, passFail])
    })
    const s = results.jawda_summary || {}
    const summary = [
      '',
      `KPIs Meeting Target: ${s.meeting_target || 0} / ${s.calculable || 0}`,
      `KPIs Below Target: ${s.below_target || 0}`,
      `KPIs Missing Data: ${s.missing_data || 0}`,
      `Overall Readiness: ${s.readiness_pct || 0}%`,
    ]
    const all = [...header, ...table.map(r => r.map(v => `"${v}"`).join(',')), ...summary]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([all.join('\n')], { type: 'text/csv' }))
    a.download = `jawda-submission-${results.quarter?.replace(' ','-')}-${results.facility}.csv`
    a.click()
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={onPrint}
        className="flex items-center gap-2 text-xs px-3 py-2 bg-gray-50 hover:bg-gray-100
          rounded-lg text-gray-600 hover:text-navy-500 font-medium transition-all border border-gray-200">
        <Printer size={13} /> Print
      </button>
      <button onClick={exportAnalysis}
        className="flex items-center gap-2 text-xs px-3 py-2 bg-gray-50 hover:bg-gray-100
          rounded-lg text-gray-600 hover:text-navy-500 font-medium transition-all border border-gray-200">
        <Download size={13} /> CSV
      </button>
      <button onClick={exportSubmission}
        className="flex items-center gap-2 text-xs px-4 py-2 bg-teal-50 hover:bg-teal-100
          rounded-lg text-teal-700 font-bold transition-all border border-teal-200">
        <Download size={13} /> Jawda Submission
      </button>
    </div>
  )
}

/* ── Section Header ────────────────────────────────────────────────────────── */

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg flex items-center justify-center">
        <Icon size={14} className="text-teal-500" />
      </div>
      <h2 className="text-sm font-bold text-navy-500 tracking-tight">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-1" />
    </div>
  )
}

/* ── Collapsible ───────────────────────────────────────────────────────────── */

function Collapsible({ title, icon: Icon, defaultOpen = false, primary = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mt-8">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 mb-4 w-full group">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          primary ? 'bg-gradient-to-br from-teal-50 to-emerald-50' : 'bg-gray-100'
        }`}>
          <Icon size={14} className={primary ? 'text-teal-500' : 'text-gray-500'} />
        </div>
        <h2 className={`text-sm font-bold tracking-tight transition-colors ${
          primary ? 'text-navy-500' : 'text-gray-500 group-hover:text-navy-500'
        }`}>{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-1" />
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="animate-slide-up">{children}</div>}
    </div>
  )
}

/* ── Main Dashboard ────────────────────────────────────────────────────────── */

/* ── Audit Trail ───────────────────────────────────────────────────────────── */

function AuditTrail({ facility }) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState(null)
  const [loading, setLoading] = useState(false)

  async function loadAudit() {
    if (entries) { setOpen(!open); return }
    setLoading(true)
    try {
      const data = await api.getAuditLog(facility)
      setEntries(data.entries || [])
      setOpen(true)
    } catch {
      setEntries([])
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8">
      <button onClick={loadAudit} className="flex items-center gap-3 mb-4 w-full group">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg flex items-center justify-center">
          <ScrollText size={14} className="text-indigo-500" />
        </div>
        <h2 className="text-sm font-bold text-navy-500 tracking-tight group-hover:text-indigo-600 transition-colors">
          Audit Trail
        </h2>
        {entries && <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">{entries.length} entries</span>}
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-1" />
        {loading ? (
          <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        ) : (
          <ChevronDown size={16} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && entries && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden animate-slide-up">
          {entries.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">No audit history yet. Results will be logged after each calculation.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {entries.map((entry, i) => (
                <div key={i} className="px-5 py-4 hover:bg-navy-50/20 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        entry.action === 'kpi_calculation' ? 'bg-teal-50 text-teal-700' :
                        entry.action === 'file_upload' ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {entry.action?.replace('_', ' ')}
                      </span>
                      {entry.quarter && <span className="text-xs font-bold text-navy-500">{entry.quarter}</span>}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString('en-GB') : ''}
                    </span>
                  </div>

                  {entry.details && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {entry.details.total_records && (
                        <p>{entry.details.total_records.toLocaleString()} records processed · {entry.details.files_used?.join(', ')}</p>
                      )}
                      {entry.details.verdict && (
                        <p>
                          Verdict: <span className={`font-bold ${
                            entry.details.verdict === 'ready' ? 'text-emerald-600' :
                            entry.details.verdict === 'attention' ? 'text-amber-600' : 'text-red-500'
                          }`}>{entry.details.verdict}</span>
                          {' — '}{entry.details.meeting_target}/{entry.details.calculable} meeting target
                        </p>
                      )}
                      {entry.details.kpi_results && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.entries(entry.details.kpi_results).map(([id, kpi]) => (
                            <span key={id} className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                              kpi.meets_target === true ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                              kpi.meets_target === false ? 'text-red-600 bg-red-50 border-red-100' :
                              'text-gray-500 bg-gray-50 border-gray-100'
                            }`}>
                              {id}: {kpi.denominator > 0 ? `${kpi.percentage}%` : '—'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main Dashboard ────────────────────────────────────────────────────────── */

export default function Dashboard({ results, onBack, onAudit }) {
  const [modal, setModal] = useState(null)
  const printRef = useRef()

  function handlePrint() {
    const printContent = printRef.current
    if (!printContent) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Jawda KPI Report — ${results.facility} — ${results.quarter}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #0D2137; padding: 20px; }
        @media print { body { padding: 10px; } }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  if (!results) return null
  const kpiEntries = Object.entries(results.kpis || {}).filter(([id]) => !id.startsWith('ERROR'))
  const errorEntries = Object.entries(results.kpis || {}).filter(([id]) => id.startsWith('ERROR'))
  const runAt = results.run_at ? new Date(results.run_at).toLocaleString('en-GB') : ''
  const summary = results.jawda_summary

  // History / trend data
  const history = results.history || {}
  const quarterList = Object.keys(history).sort()
  const currentQ = results.quarter
  const currentIdx = quarterList.indexOf(currentQ)
  const prevQ = currentIdx > 0 ? quarterList[currentIdx - 1] : null
  const prevData = prevQ ? history[prevQ] : null

  return (
    <div className="min-h-screen">

      {/* Top bar — export actions */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Activity size={16} className="text-teal-500" />
          <span className="text-sm font-bold text-navy-500">KPI Dashboard</span>
          <span className="text-xs text-gray-400">{runAt}</span>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons results={results} onPrint={handlePrint} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-navy-50 to-navy-100/50 rounded-2xl flex items-center justify-center shadow-card">
              <Building size={22} className="text-navy-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy-500 tracking-tight">{results.facility}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 px-3 py-1 rounded-lg font-bold border border-teal-100/50">
                  {results.quarter}
                </span>
                <span className="text-xs text-gray-500">
                  {results.total_records?.toLocaleString()} records · DOH Jawda V2 2026
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quarter tabs — show if history has multiple quarters */}
        {quarterList.length > 1 && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-gray-500 font-medium mr-2">Quarters:</span>
            {quarterList.map(q => (
              <span key={q} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                q === currentQ
                  ? 'bg-navy-500 text-white shadow-card'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {q}
                {history[q]?.jawda_summary && (
                  <span className={`ml-1.5 ${
                    history[q].jawda_summary.verdict === 'ready' ? 'text-emerald-300' :
                    history[q].jawda_summary.verdict === 'attention' ? 'text-amber-300' : 'text-red-300'
                  }`}>
                    {history[q].jawda_summary.meeting_target}/{history[q].jawda_summary.calculable}
                  </span>
                )}
              </span>
            ))}
            {prevData && (
              <span className="text-[10px] text-gray-400 ml-auto">
                vs {prevQ}: {prevData.jawda_summary?.meeting_target || 0}/{prevData.jawda_summary?.calculable || 0} meeting target
              </span>
            )}
          </div>
        )}

        {/* Readiness Verdict */}
        <ReadinessVerdict summary={summary} results={results} />

        {/* Jawda Portal Ready */}
        <JawdaPortalView kpis={results.kpis || {}} facility={results.facility} quarter={results.quarter} />

        {/* Summary cards */}
        <SummaryBar kpis={results.kpis || {}} />

        {/* KPI Grid */}
        <div className="mt-8">
          <SectionHeader icon={FileBarChart} title="All 8 Official KPIs — DOH V2 2026" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiEntries.map(([id, kpi], i) => {
              const prevKpi = prevData?.kpis?.[id] || null
              return (
                <div key={id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                  <KPICard kpiId={id} kpi={kpi} prevKpi={prevKpi} prevQuarter={prevQ} onClick={setModal} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Quarter Comparison */}
        <QuarterComparison
          currentQ={currentQ}
          currentKpis={results.kpis || {}}
          prevQ={prevQ}
          prevData={prevData}
        />

        {/* Action Plan */}
        <ActionPlan kpis={results.kpis || {}} />

        {/* Errors */}
        {errorEntries.length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-5">
            <p className="text-sm font-bold text-red-800 mb-2">Calculation errors</p>
            {errorEntries.map(([id, e]) => (
              <p key={id} className="text-xs text-red-700">{id}: {e.error}</p>
            ))}
          </div>
        )}

        {/* Data Quality — expanded by default, prominent heading */}
        <Collapsible title="Data Quality & Readiness" icon={Activity} defaultOpen primary>
          <DataQuality quality={results.data_quality} />
        </Collapsible>

        {/* Column Mapping — collapsed by default */}
        <Collapsible title="Column Mapping" icon={Layers}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(results.col_mapping || {}).map(([field, col]) => (
                <div key={field} className="flex items-center gap-3 text-xs bg-gradient-to-r from-navy-50/50 to-transparent rounded-xl px-4 py-3 group hover:from-teal-50/50 transition-all">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                  <span className="text-gray-500 truncate">{field}</span>
                  <span className="text-navy-500 font-bold truncate ml-auto">{col}</span>
                </div>
              ))}
            </div>
          </div>
        </Collapsible>

        {/* Footer */}
        <div className="mt-14 text-center pb-8">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-auto mb-4" />
          <p className="text-[11px] text-gray-300 font-medium">
            Powered by TriZodiac — DOH Outpatient Medical Centers Jawda Guidance V2 2026
          </p>
        </div>
      </div>

      <KPIModal data={modal} onClose={() => setModal(null)} />
      <PrintReport ref={printRef} results={results} />
    </div>
  )
}
