import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, Target, Users, TrendingUp, TrendingDown, Minus, Info,
         CheckCircle, AlertTriangle, XCircle, SlidersHorizontal, Calculator,
         ClipboardList, BarChart3, Download } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const OFFICIAL_DEFS = {
  OMC001: { threshold: 'Ratio >= 0.50', pop: 'Age 5-64, moderate-to-severe asthma (J45.40-J45.52)', needs: 'Prescription data — controller vs reliever drug units per patient per quarter. Pharmacy integration required.', fix: 'Add a drug_name column to your HIS export with medication names. Your pharmacy team can export this from their dispensing system.' },
  OMC002: { threshold: 'Not prescribed antibiotics within 3 days', pop: 'Age >= 3 months, bronchitis/bronchiolitis (J20.x, J21.x)', needs: 'Prescription data within 3 days of bronchitis diagnosis.', fix: 'Include prescription data in your HIS export. The engine needs drug names within 3 days of each bronchitis visit.' },
  OMC003: { threshold: 'Seen within 60 minutes', pop: 'All outpatients registering at clinic', needs: 'Registration + consult-start timestamps or pre-calculated wait minutes.', fix: 'Set up your check-in app to capture registration + consult-start timestamps and pass them to Malaffi.' },
  OMC004: { threshold: 'BMI >= 25, management plan documented', pop: 'Age >= 18, BMI >= 25, not pregnant, visited in last 12 months', needs: 'Physician management plan documentation field.', fix: 'Add a management_plan field to your physician screen. Doctors need to document BMI counselling plans for patients with BMI >= 25.' },
  OMC005: { threshold: 'HbA1c <= 8.0% (V2 2026)', pop: 'Age 18-75, diabetes (E10/E11/E13), 2+ visits in 9 months', needs: 'HbA1c lab result value (CPT 83036) + collection date.', fix: 'Integrate HbA1c lab results into your HIS export. Contact your lab system vendor for the data feed.' },
  OMC006: { threshold: 'BP < 130/80 mmHg', pop: 'Age 18-85, hypertension (I10-I13), 2+ visits in 9 months', needs: 'Confirmed hypertension ICD code + BP readings.', fix: 'Ensure hypertension patients have confirmed ICD codes (I10-I13) in their records.' },
  OMC007: { threshold: '>=15 days in 30 days OR >=31 days in 62 days', pop: 'Age >= 18, new opioid prescription (no prior in 60 days)', needs: 'Days supplied, drug name, drug class. Direction: LOWER is better.', fix: 'Add days_supplied to your pharmacy export so the engine can calculate thresholds accurately.' },
  OMC008: { threshold: 'Both eGFR and uACR tested every 6 months', pop: 'Age >= 18, eGFR < 90 ml/min/1.73m2', needs: 'eGFR numeric result + uACR result with collection dates.', fix: 'Integrate eGFR and uACR lab results into your HIS export.' },
}

const DOMAIN_COLORS = {
  Effectiveness: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
  Safety: { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' },
  Timeliness: { text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-100' },
  'Patient-Centredness': { text: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-100' },
  Coordination: { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' },
}

function LargeGauge({ pct, status, target, direction }) {
  const r = 70, cx = 85, cy = 85
  const circumference = Math.PI * r
  const noData = status === 'insufficient_data' || status === 'not_applicable'
  const filled = noData ? 0 : (Math.min(pct, 100) / 100) * circumference
  const targetAngle = (target / 100) * Math.PI
  const tickX = cx - r * Math.cos(targetAngle)
  const tickY = cy - r * Math.sin(targetAngle)

  const color = status === 'calculated' || status === 'proxy'
    ? (pct >= target ? '#10B981' : '#EF4444')
    : '#D1D5DB'

  return (
    <svg width="170" height="100" viewBox="0 0 170 100">
      <path d={`M10 85 A${r} ${r} 0 0 1 160 85`}
        fill="none" stroke="#E5E7EB" strokeWidth="8" strokeLinecap="round" />
      {!noData && (
        <path d={`M10 85 A${r} ${r} 0 0 1 160 85`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }} />
      )}
      {!noData && target > 0 && target < 100 && (
        <circle cx={tickX} cy={tickY} r="4" fill="#0D2137" opacity="0.3" />
      )}
      <text x={cx} y="80" textAnchor="middle" fontSize="28" fontWeight="900" fill="#0D2137">
        {noData ? (status === 'not_applicable' ? 'N/A' : '—') : `${pct}%`}
      </text>
    </svg>
  )
}

function WhatIfSimulator({ kpi, direction }) {
  const num = kpi.numerator || 0
  const den = kpi.denominator || 1
  const target = kpi.target || 0
  const isLower = direction === 'lower'
  const maxSlide = isLower ? num : (den - num)
  const [delta, setDelta] = useState(0)

  if (den === 0 || maxSlide <= 0) return null

  const newNum = isLower ? num - delta : num + delta
  const newPct = Math.round((newNum / den) * 1000) / 10
  const wouldPass = isLower ? newPct <= target : newPct >= target
  const currentPct = Math.round((num / den) * 1000) / 10

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
          <SlidersHorizontal size={16} className="text-indigo-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-navy-500">What-If Simulator</h3>
          <p className="text-xs text-gray-500">
            {isLower ? 'What if fewer patients were at risk?' : 'What if more patients met criteria?'}
          </p>
        </div>
      </div>
      <input type="range" min="0" max={maxSlide} value={delta}
        onChange={e => setDelta(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer mb-4
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:bg-navy-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md" />
      <div className="flex justify-between text-[9px] text-gray-400 font-bold mb-4">
        <span>No change</span>
        <span>{isLower ? `−${maxSlide}` : `+${maxSlide}`} patients</span>
      </div>
      <div className="bg-navy-50/30 rounded-xl p-4 flex items-center gap-6">
        <div className="text-center flex-1">
          <div className="text-lg font-black text-gray-400">{currentPct}%</div>
          <div className="text-[9px] text-gray-400 font-bold uppercase">Current</div>
          <div className="text-[9px] text-gray-400">{num}/{den}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className={`text-sm font-black ${delta > 0 ? 'text-navy-500' : 'text-gray-300'}`}>
            {delta > 0 ? (isLower ? `−${delta}` : `+${delta}`) : '—'}
          </div>
          <div className="text-gray-300 text-lg">→</div>
        </div>
        <div className="text-center flex-1">
          <div className={`text-2xl font-black ${
            delta === 0 ? 'text-gray-300' : wouldPass ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {delta > 0 ? `${newPct}%` : '—'}
          </div>
          <div className="text-[9px] text-gray-500 font-bold uppercase">Projected</div>
          {delta > 0 && (
            <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded inline-block ${
              wouldPass ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'
            }`}>
              {wouldPass ? 'PASS' : 'Still below'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function KPIDetailPage({ kpiId, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedQ, setSelectedQ] = useState(null)
  const [benchmark, setBenchmark] = useState(null)

  useEffect(() => {
    axios.get(`${BASE}/api/clinic/dashboard`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
    // Fetch benchmark data
    axios.get(`${BASE}/api/clinic/benchmark/${kpiId}`)
      .then(res => setBenchmark(res.data))
      .catch(() => setBenchmark(null))
  }, [kpiId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-navy-200 border-t-navy-500 rounded-full animate-spin" />
      </div>
    )
  }

  const history = data?.history || {}
  const quarters = Object.keys(history).sort()
  const activeQ = selectedQ || quarters[quarters.length - 1]
  const kpi = activeQ ? (history[activeQ]?.kpis?.[kpiId] || null) : null
  const def = OFFICIAL_DEFS[kpiId] || {}
  const direction = kpi?.target_direction || 'higher'
  const domain = kpi?.domain || ''
  const domainStyle = DOMAIN_COLORS[domain] || { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100' }

  // Trend data across all quarters for this KPI
  const trendData = quarters.map(q => {
    const k = history[q]?.kpis?.[kpiId]
    if (!k || k.denominator === 0 || k.status === 'insufficient_data' || k.status === 'not_applicable') return null
    return { quarter: q, pct: k.percentage, num: k.numerator, den: k.denominator, meets: k.meets_target }
  }).filter(Boolean)

  // Gap calculation
  const gap = (() => {
    if (!kpi || kpi.denominator === 0 || kpi.meets_target !== false) return null
    const target = kpi.target || 0
    if (direction === 'lower') {
      const maxNum = Math.floor(kpi.denominator * target / 100)
      return { needed: kpi.numerator - maxNum, action: 'reduce from risk group' }
    } else {
      const minNum = Math.ceil(kpi.denominator * target / 100)
      return { needed: minNum - kpi.numerator, action: 'need to meet criteria' }
    }
  })()

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="text-gray-400 hover:text-navy-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-black text-navy-300 bg-navy-50 px-2.5 py-1 rounded-lg tracking-widest">{kpiId}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${domainStyle.text} ${domainStyle.bg} ${domainStyle.border}`}>{domain}</span>
            </div>
            <h1 className="text-2xl font-black text-navy-500">{kpi?.title || def.threshold || kpiId}</h1>
          </div>
          {/* Quarter selector */}
          <div className="flex items-center gap-1.5">
            {quarters.map(q => (
              <button key={q} onClick={() => setSelectedQ(q)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  q === activeQ ? 'bg-navy-500 text-white shadow-card' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>{q}</button>
            ))}
          </div>
        </div>

        {!kpi ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
            <XCircle size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-navy-500 mb-1">No data for {kpiId} in {activeQ}</p>
            <p className="text-xs text-gray-500">Upload data for this quarter to see results.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score hero */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <div className="flex items-center gap-8">
                <LargeGauge pct={kpi.percentage || 0} status={kpi.status} target={kpi.target || 50} direction={direction} />
                <div className="flex-1">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-navy-50/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-black text-navy-500">{kpi.numerator}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Numerator</div>
                    </div>
                    <div className="bg-navy-50/50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-black text-navy-500">{kpi.denominator}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Denominator</div>
                    </div>
                    <div className={`rounded-xl p-4 text-center ${
                      kpi.meets_target === true ? 'bg-emerald-50' :
                      kpi.meets_target === false ? 'bg-red-50' :
                      kpi.status === 'not_applicable' ? 'bg-blue-50' : 'bg-gray-50'
                    }`}>
                      <div className={`text-2xl font-black ${
                        kpi.meets_target === true ? 'text-emerald-600' :
                        kpi.meets_target === false ? 'text-red-500' :
                        kpi.status === 'not_applicable' ? 'text-blue-500' : 'text-gray-400'
                      }`}>
                        {kpi.denominator > 0 ? `${kpi.percentage}%` : (kpi.status === 'not_applicable' ? 'N/A' : '—')}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {kpi.meets_target === true ? 'PASS' : kpi.meets_target === false ? 'BELOW TARGET' : kpi.status === 'not_applicable' ? 'NOT APPLICABLE' : 'NO DATA'}
                      </div>
                    </div>
                  </div>
                  {/* Status banner */}
                  {kpi.meets_target === true && (
                    <div className="flex gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-700 font-medium">Meets DOH target ({direction === 'lower' ? '≤' : '≥'}{kpi.target}%). Ready for Jawda submission.</p>
                    </div>
                  )}
                  {kpi.meets_target === false && gap && (
                    <div className="flex gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
                      <Calculator size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 font-medium">
                        <strong>{gap.needed} more patient{gap.needed !== 1 ? 's' : ''}</strong> {gap.action} to reach {direction === 'lower' ? '≤' : '≥'}{kpi.target}%.
                      </p>
                    </div>
                  )}
                  {kpi.status === 'not_applicable' && (
                    <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 font-medium">No eligible patients for this KPI. Normal for specialised clinics. Excluded from readiness score.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trend chart — full width */}
            {trendData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <h3 className="text-sm font-bold text-navy-500 mb-4">Trend Across Quarters</h3>
                <div className="h-32">
                  <svg width="100%" height="128" viewBox="0 0 600 128" className="overflow-visible">
                    {(() => {
                      const padX = 40, padY = 15
                      const w = 600 - padX * 2, h = 128 - padY * 2
                      const target = kpi.target || 50
                      const targetY = padY + h - (Math.min(100, target) / 100) * h
                      const pts = trendData.map((d, i) => ({
                        x: trendData.length === 1 ? padX + w / 2 : padX + (i * w) / (trendData.length - 1),
                        y: padY + h - (Math.min(100, d.pct) / 100) * h,
                        ...d,
                      }))
                      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                      return (
                        <>
                          <line x1={padX} x2={600 - padX} y1={targetY} y2={targetY} stroke="#14B8A6" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                          <text x={600 - padX + 5} y={targetY + 4} fontSize="10" fill="#14B8A6" opacity="0.7">target {target}%</text>
                          <path d={d} fill="none" stroke="#0D2137" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {pts.map((p, i) => (
                            <g key={i}>
                              <circle cx={p.x} cy={p.y} r={p.quarter === activeQ ? 5 : 3.5}
                                fill={p.meets ? '#10B981' : '#EF4444'} stroke="white" strokeWidth="2" />
                              <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="700"
                                fill={p.meets ? '#059669' : '#DC2626'}>{p.pct}%</text>
                              <text x={p.x} y={h + padY + 14} textAnchor="middle" fontSize="9" fill="#9CA3AF" fontWeight="500">
                                {p.quarter.replace(/20(\d{2})/, '$1')}
                              </text>
                            </g>
                          ))}
                        </>
                      )
                    })()}
                  </svg>
                </div>
              </div>
            )}

            {/* What-If Simulator */}
            {kpi.denominator > 0 && kpi.meets_target !== true && kpi.status !== 'insufficient_data' && kpi.status !== 'not_applicable' && (
              <WhatIfSimulator kpi={kpi} direction={direction} />
            )}

            {/* DOH Definition */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <h3 className="text-sm font-bold text-navy-500 mb-4">DOH V2 2026 Definition</h3>
              <div className="space-y-4">
                {[
                  { icon: Target, label: 'Target', value: def.threshold },
                  { icon: Users, label: 'Eligible Population', value: def.pop },
                  { icon: direction === 'lower' ? TrendingDown : TrendingUp, label: 'Direction', value: direction === 'lower' ? 'Lower is better' : 'Higher is better' },
                  { icon: ClipboardList, label: 'Data Required', value: def.needs },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex gap-4 items-start">
                    <div className="w-8 h-8 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-teal-500" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</div>
                      <div className="text-sm text-navy-500 font-medium mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How to fix */}
            {kpi.meets_target === false && def.fix && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-5 flex gap-4">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Info size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-800">How to Improve</p>
                  <p className="text-sm text-blue-700/80 mt-0.5">{def.fix}</p>
                </div>
              </div>
            )}

            {/* Benchmarking */}
            {benchmark?.available && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <h3 className="text-sm font-bold text-navy-500 mb-4 flex items-center gap-2">
                  <BarChart3 size={14} className="text-indigo-500" /> Clinic Benchmarking
                </h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-indigo-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-indigo-600">#{benchmark.rank}</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase">Rank</div>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-indigo-600">{benchmark.percentile}%</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase">Percentile</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-navy-500">{benchmark.average}%</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase">Avg All Clinics</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-navy-500">{benchmark.total_clinics}</div>
                    <div className="text-[9px] text-gray-500 font-bold uppercase">Clinics</div>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
                  <div className="absolute h-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 rounded-full" style={{ width: '100%', opacity: 0.3 }} />
                  <div className="absolute h-full w-1 bg-navy-500 rounded-full" style={{ left: `${benchmark.your_percentage}%` }} title={`You: ${benchmark.your_percentage}%`} />
                  <div className="absolute h-full w-0.5 bg-gray-400" style={{ left: `${benchmark.average}%` }} title={`Avg: ${benchmark.average}%`} />
                </div>
                <div className="flex justify-between text-[8px] text-gray-400 mt-1">
                  <span>Min: {benchmark.min}%</span>
                  <span>Your clinic: {benchmark.your_percentage}%</span>
                  <span>Max: {benchmark.max}%</span>
                </div>
              </div>
            )}

            {/* Missing fields */}
            {kpi.missing_fields?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <h3 className="text-sm font-bold text-navy-500 mb-3">Missing Data Fields</h3>
                <div className="space-y-2">
                  {kpi.missing_fields.map((f, i) => (
                    <div key={i} className="flex gap-3 items-center bg-red-50/60 rounded-xl px-4 py-3 border border-red-100/50">
                      <XCircle size={14} className="text-red-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {kpi.notes?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <h3 className="text-sm font-bold text-navy-500 mb-3">Calculation Notes</h3>
                <div className="space-y-2">
                  {kpi.notes.map((n, i) => (
                    <div key={i} className="flex gap-3 items-start text-xs text-gray-600 bg-navy-50/30 rounded-xl px-4 py-3">
                      <Info size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patient Cohort Export */}
            {kpi.patient_details?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-navy-500">Patient Cohort</h3>
                  <button onClick={() => {
                    const headers = Object.keys(kpi.patient_details[0])
                    const csv = [headers.join(','), ...kpi.patient_details.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n')
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
                    a.download = `${kpiId}-patients-${activeQ?.replace(/\s/g, '-')}.csv`
                    a.click()
                  }}
                    className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 hover:bg-teal-100 transition-colors">
                    <Download size={12} /> Export CSV
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mb-3">
                  {kpi.patient_details.length} patient{kpi.patient_details.length !== 1 ? 's' : ''} in this KPI's calculation.
                  Export to identify patients who need intervention.
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-gray-50">
                        {Object.keys(kpi.patient_details[0]).map(h => (
                          <th key={h} className="px-3 py-2 text-left text-navy-400 font-bold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {kpi.patient_details.slice(0, 20).map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-3 py-1.5 text-gray-700">{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {kpi.patient_details.length > 20 && (
                    <div className="px-3 py-2 bg-gray-50 text-[9px] text-gray-400 text-center">
                      Showing 20 of {kpi.patient_details.length} · Export CSV for full list
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
