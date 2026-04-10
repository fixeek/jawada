import { useState } from 'react'
import { X, AlertTriangle, Info, TrendingUp, TrendingDown, Users, Target, CheckCircle, Calculator, SlidersHorizontal } from 'lucide-react'

const OFFICIAL_DEFS = {
  OMC001: { threshold: 'Ratio >= 0.50', pop: 'Age 5-64, moderate-to-severe asthma (J45.40-J45.52)', needs: 'Prescription data — controller vs reliever drug units per patient per quarter. Pharmacy integration required.' },
  OMC002: { threshold: 'Not prescribed antibiotics', pop: 'Age >= 3 months, bronchitis/bronchiolitis (J20.x, J21.x)', needs: 'Prescription data within 3 days of bronchitis diagnosis.' },
  OMC003: { threshold: 'Seen within 60 minutes', pop: 'All outpatients registering at clinic', needs: 'Auto-collected from Malaffi. App must pass registration + consult-start timestamps.' },
  OMC004: { threshold: 'BMI >= 25, management plan every 6 months', pop: 'Age >= 18, BMI >= 25, not pregnant, visited in last 12 months', needs: 'Physician management plan documentation. Management plan field required.' },
  OMC005: { threshold: 'HbA1c <= 8.0% (V2 2026)', pop: 'Age 18-75, diabetes diagnosis (E10/E11/E13), 2+ visits in prior 9 months', needs: 'HbA1c lab result value (CPT 83036) + collection date. Lab integration required.' },
  OMC006: { threshold: 'BP < 130/80 mmHg', pop: 'Age 18-85, hypertension (I10-I13), 2+ HTN visits in prior 9 months', needs: 'Confirmed hypertension ICD code + 9-month visit history per patient.' },
  OMC007: { threshold: '>= 15 days opioids in 30 days OR >= 31 days in 62 days', pop: 'Age >= 18, new opioid prescription', needs: 'Days supplied, drug name, drug class, new-start date. Desired direction: LOWER.' },
  OMC008: { threshold: 'Both eGFR and uACR tested every 6 months', pop: 'Age >= 18, eGFR < 90 ml/min/1.73m2', needs: 'eGFR numeric result + uACR result with collection dates. Lab integration required.' },
}

/* ── What-If Simulator ─────────────────────────────────────────────────────── */

function WhatIfSimulator({ kpi, direction }) {
  const num = kpi.numerator || 0
  const den = kpi.denominator || 1
  const target = kpi.target || 0

  // For "lower is better" KPIs, slider removes patients from numerator
  // For "higher is better" KPIs, slider adds patients to numerator
  const isLower = direction === 'lower'
  const maxSlide = isLower ? num : (den - num)
  const [delta, setDelta] = useState(0)

  if (den === 0 || maxSlide <= 0) return null

  const newNum = isLower ? num - delta : num + delta
  const newPct = Math.round((newNum / den) * 1000) / 10
  const wouldPass = isLower ? newPct <= target : newPct >= target
  const currentPct = Math.round((num / den) * 1000) / 10

  return (
    <div className="bg-gradient-to-br from-navy-50/60 to-indigo-50/30 rounded-2xl p-6 border border-navy-100/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <SlidersHorizontal size={14} className="text-indigo-500" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-navy-500">What-If Simulator</h4>
          <p className="text-[10px] text-gray-500">
            {isLower
              ? 'Drag to see the effect of reducing patients from the risk group'
              : 'Drag to see the effect of more patients meeting criteria'}
          </p>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <input type="range" min="0" max={maxSlide} value={delta}
          onChange={e => setDelta(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:bg-navy-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-grab" />
        <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-1">
          <span>No change</span>
          <span>{isLower ? `-${maxSlide}` : `+${maxSlide}`} patients</span>
        </div>
      </div>

      {/* Result */}
      <div className="bg-white rounded-xl p-4 flex items-center gap-6">
        {/* Current */}
        <div className="text-center flex-1">
          <div className="text-lg font-black text-gray-400">{currentPct}%</div>
          <div className="text-[9px] text-gray-400 font-bold uppercase">Current</div>
          <div className="text-[9px] text-gray-400">{num}/{den}</div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center">
          <div className={`text-sm font-black ${delta > 0 ? 'text-navy-500' : 'text-gray-300'}`}>
            {delta > 0 ? (isLower ? `−${delta}` : `+${delta}`) : '—'}
          </div>
          <div className="text-gray-300 text-lg">→</div>
        </div>

        {/* Projected */}
        <div className="text-center flex-1">
          <div className={`text-2xl font-black ${
            delta === 0 ? 'text-gray-300' :
            wouldPass ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {delta > 0 ? `${newPct}%` : '—'}
          </div>
          <div className="text-[9px] text-gray-500 font-bold uppercase">Projected</div>
          {delta > 0 && (
            <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded inline-block ${
              wouldPass
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                : 'text-red-600 bg-red-50 border border-red-100'
            }`}>
              {wouldPass ? 'PASS' : 'Still below target'}
            </div>
          )}
          {delta > 0 && <div className="text-[9px] text-gray-400 mt-0.5">{newNum}/{den}</div>}
        </div>
      </div>
    </div>
  )
}


export default function KPIModal({ data, onClose }) {
  if (!data) return null
  const { kpiId, kpi } = data
  const def = OFFICIAL_DEFS[kpiId] || {}
  const isCalculated = kpi.status === 'calculated'
  const isProxy = kpi.status === 'proxy'
  const direction = kpi.target_direction || 'higher'
  const domain = kpi.domain || ''

  // Result color based on target, not just status
  const resultColor = kpi.meets_target === true ? 'text-emerald-700 bg-emerald-50'
    : kpi.meets_target === false ? 'text-red-600 bg-red-50'
    : kpi.status === 'insufficient_data' ? 'text-gray-500 bg-gray-50'
    : 'text-amber-700 bg-amber-50'

  return (
    <div className="fixed inset-0 bg-navy-500/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-100"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-navy-500 via-navy-500 to-navy-400 rounded-t-3xl px-8 py-7 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-teal-400/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-black text-teal-300 bg-teal-300/15 px-3 py-1.5 rounded-lg border border-teal-300/10">{kpiId}</span>
                <span className="text-xs text-navy-200 font-semibold">{domain}</span>
              </div>
              <h2 className="text-white font-bold text-xl leading-tight">{kpi.title}</h2>
            </div>
            <button onClick={onClose}
              className="text-navy-300 hover:text-white ml-4 flex-shrink-0 w-9 h-9 rounded-xl
                hover:bg-white/10 flex items-center justify-center transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-7">

          {/* Result cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-navy-50/50 rounded-2xl p-5 text-center">
              <div className="text-3xl font-black text-navy-500">{kpi.numerator}</div>
              <div className="text-[11px] text-gray-500 mt-1.5 font-semibold uppercase tracking-wider">Numerator</div>
            </div>
            <div className="bg-navy-50/50 rounded-2xl p-5 text-center">
              <div className="text-3xl font-black text-navy-500">{kpi.denominator}</div>
              <div className="text-[11px] text-gray-500 mt-1.5 font-semibold uppercase tracking-wider">Denominator</div>
            </div>
            <div className={`rounded-2xl p-5 text-center ${resultColor.split(' ')[1]}`}>
              <div className={`text-3xl font-black ${resultColor.split(' ')[0]}`}>
                {kpi.denominator > 0 ? `${kpi.percentage}%` : '—'}
              </div>
              <div className="text-[11px] text-gray-500 mt-1.5 font-semibold uppercase tracking-wider">Result</div>
            </div>
          </div>

          {/* Target comparison banner */}
          {kpi.meets_target === true && (
            <div className="flex gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle size={16} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">Meets DOH Target</p>
                <p className="text-sm text-emerald-700/80 mt-0.5">{kpi.percentage}% {direction === 'lower' ? '≤' : '≥'} {kpi.target}% target. This KPI is ready for Jawda submission.</p>
              </div>
            </div>
          )}
          {kpi.meets_target === false && (
            <div className="flex gap-4 bg-red-50 border border-red-100 rounded-2xl p-5">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Target size={16} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-800">Below DOH Target</p>
                <p className="text-sm text-red-700/80 mt-0.5">
                  {kpi.percentage}% vs {direction === 'lower' ? '≤' : '≥'}{kpi.target}% target.
                  {kpi.gap_patients > 0 && (
                    direction === 'lower'
                      ? ` Need to reduce ${kpi.gap_patients} patient${kpi.gap_patients > 1 ? 's' : ''} from risk threshold.`
                      : ` Need ${kpi.gap_patients} more patient${kpi.gap_patients > 1 ? 's' : ''} meeting criteria to pass.`
                  )}
                </p>
              </div>
            </div>
          )}
          {isProxy && (
            <div className="flex gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <AlertTriangle size={16} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">Proxy Result</p>
                <p className="text-sm text-amber-700/80 mt-0.5">Based on available data. Official submission requires additional fields.</p>
              </div>
            </div>
          )}
          {!isCalculated && !isProxy && (
            <div className="flex gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <AlertTriangle size={16} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">Cannot Calculate</p>
                <p className="text-sm text-gray-500 mt-0.5">Required data fields are missing from the uploaded file.</p>
              </div>
            </div>
          )}

          {/* Gap-to-target calculator */}
          {kpi.denominator > 0 && kpi.meets_target === false && (
            (() => {
              const target = kpi.target || 0
              const num = kpi.numerator || 0
              const den = kpi.denominator || 1
              let needed, scenario
              if (direction === 'lower') {
                // Need to reduce numerator so num/den <= target/100
                const maxNum = Math.floor(den * target / 100)
                needed = num - maxNum
                scenario = `Reduce ${needed} patient${needed !== 1 ? 's' : ''} from the risk group`
              } else {
                // Need to increase numerator so num/den >= target/100
                const minNum = Math.ceil(den * target / 100)
                needed = minNum - num
                scenario = `${needed} more patient${needed !== 1 ? 's' : ''} need${needed === 1 ? 's' : ''} to meet criteria`
              }
              if (needed <= 0) return null
              const newPct = direction === 'lower'
                ? Math.round(((num - needed) / den) * 1000) / 10
                : Math.round(((num + needed) / den) * 1000) / 10
              return (
                <div className="bg-gradient-to-r from-violet-50 to-blue-50/50 border border-violet-100/60 rounded-2xl p-5">
                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Calculator size={16} className="text-violet-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-violet-800">Gap to Target</p>
                      <p className="text-sm text-violet-700/80 mt-1">{scenario} to reach {direction === 'lower' ? '≤' : '≥'}{target}%.</p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-lg font-black text-red-500">{kpi.percentage}%</div>
                          <div className="text-[9px] text-gray-500 font-bold uppercase">Now</div>
                        </div>
                        <div className="text-gray-300 font-bold">→</div>
                        <div className="text-center">
                          <div className="text-lg font-black text-emerald-600">{newPct}%</div>
                          <div className="text-[9px] text-gray-500 font-bold uppercase">Target</div>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-2xl font-black text-violet-700">{needed}</div>
                          <div className="text-[9px] text-gray-500 font-bold uppercase">Patients</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()
          )}

          {/* What-If Simulator */}
          {kpi.denominator > 0 && kpi.meets_target !== true && kpi.status !== 'insufficient_data' && (
            <WhatIfSimulator kpi={kpi} direction={direction} />
          )}

          {/* Official definition */}
          <div className="bg-gradient-to-br from-navy-50/60 to-teal-50/20 rounded-2xl p-6 border border-navy-100/30">
            <h4 className="text-[11px] font-black text-navy-500 uppercase tracking-widest mb-4">Official DOH v1.4 Definition</h4>
            <div className="space-y-4">
              {[
                { icon: Target, label: 'Target', value: def.threshold },
                { icon: Users, label: 'Population', value: def.pop },
                { icon: direction === 'lower' ? TrendingDown : TrendingUp,
                  label: 'Direction', value: direction === 'lower' ? 'Lower is better' : 'Higher is better' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100/50">
                    <Icon size={14} className="text-teal-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</div>
                    <div className="text-sm text-navy-500 font-semibold mt-0.5">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing fields */}
          {kpi.missing_fields?.length > 0 && (
            <div>
              <h4 className="text-[11px] font-black text-navy-500 uppercase tracking-widest mb-3">Missing Data Fields</h4>
              <div className="space-y-2">
                {kpi.missing_fields.map((f, i) => (
                  <div key={i} className="flex gap-3 items-center bg-red-50/60 rounded-xl px-5 py-3 border border-red-100/50">
                    <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <X size={12} className="text-red-500" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How to fix */}
          {def.needs && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100/60 rounded-2xl p-5 flex gap-4">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Info size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-800">How to Fix</p>
                <p className="text-sm text-blue-700/80 mt-0.5">{def.needs}</p>
              </div>
            </div>
          )}

          {/* Patient details */}
          {kpi.patient_details?.length > 0 && (
            <div>
              <h4 className="text-[11px] font-black text-navy-500 uppercase tracking-widest mb-3">
                Sample Patient Records
                <span className="text-gray-500 font-semibold ml-2 normal-case tracking-normal text-xs">
                  {Math.min(kpi.patient_details.length, 10)} of {kpi.patient_details.length}
                </span>
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-card">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gradient-to-r from-navy-50 to-navy-50/50">
                      {Object.keys(kpi.patient_details[0]).map(k => (
                        <th key={k} className="px-5 py-3.5 text-left text-navy-400 font-bold uppercase tracking-wider text-[10px]">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kpi.patient_details.slice(0, 10).map((row, i) => (
                      <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-teal-50/30 transition-colors`}>
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-5 py-3 text-gray-700 font-medium">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
