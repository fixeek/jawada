import { forwardRef } from 'react'

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

const PrintReport = forwardRef(({ results }, ref) => {
  if (!results) return null

  const kpis = Object.entries(results.kpis || {}).filter(([id]) => !id.startsWith('ERROR'))
  const summary = results.jawda_summary || {}
  const dq = results.data_quality || {}

  return (
    <div ref={ref} className="hidden print:block" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#0D2137', padding: '20px' }}>

      {/* Header */}
      <div style={{ borderBottom: '3px solid #0D9488', paddingBottom: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 4px 0', color: '#0D2137' }}>
              Jawda KPI Readiness Report
            </h1>
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
              DOH Outpatient Medical Centers — Guidance V2 2026
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: '700', fontSize: '14px', margin: '0 0 2px 0' }}>{results.facility}</p>
            <p style={{ color: '#0D9488', fontWeight: '700', margin: '0 0 2px 0' }}>{results.quarter}</p>
            <p style={{ color: '#999', fontSize: '10px', margin: 0 }}>
              Generated: {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
      </div>

      {/* Readiness Summary */}
      <div style={{ backgroundColor: summary.verdict === 'ready' ? '#ECFDF5' : summary.verdict === 'attention' ? '#FFFBEB' : '#FEF2F2',
        border: `1px solid ${summary.verdict === 'ready' ? '#A7F3D0' : summary.verdict === 'attention' ? '#FDE68A' : '#FECACA'}`,
        borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: '800', fontSize: '14px', margin: '0 0 4px 0' }}>
              {summary.verdict === 'ready' ? 'Ready for Jawda Submission'
                : summary.verdict === 'attention' ? `${summary.below_target + summary.missing_data} KPIs need attention`
                : 'Not ready for Jawda submission'}
            </p>
            <p style={{ color: '#666', margin: 0, fontSize: '11px' }}>
              {summary.meeting_target} of {summary.calculable} calculable KPIs meeting DOH targets
              {summary.missing_data > 0 && ` · ${summary.missing_data} cannot be calculated`}
              {summary.proxy_data > 0 && ` · ${summary.proxy_data} using proxy data`}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '28px', fontWeight: '900', margin: 0, color: '#0D2137' }}>{summary.readiness_pct}%</p>
            <p style={{ fontSize: '9px', color: '#999', margin: 0 }}>READINESS</p>
          </div>
        </div>
      </div>

      {/* KPI Results Table */}
      <h2 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#0D9488', marginBottom: '8px' }}>
        KPI Results — All 8 Official Indicators
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#0D2137', color: 'white' }}>
            <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: '700' }}>KPI</th>
            <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: '700' }}>Title</th>
            <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: '700' }}>Domain</th>
            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '700' }}>Num</th>
            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '700' }}>Den</th>
            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '700' }}>Rate</th>
            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '700' }}>Target</th>
            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '700' }}>Result</th>
          </tr>
        </thead>
        <tbody>
          {kpis.map(([id, k], i) => {
            const pass = k.meets_target === true
            const fail = k.meets_target === false
            const bgColor = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
            return (
              <tr key={id} style={{ backgroundColor: bgColor }}>
                <td style={{ padding: '7px 6px', fontWeight: '800', borderBottom: '1px solid #E5E7EB' }}>{id}</td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #E5E7EB' }}>{k.title}</td>
                <td style={{ padding: '7px 6px', borderBottom: '1px solid #E5E7EB', fontSize: '9px', color: '#666' }}>{k.domain}</td>
                <td style={{ padding: '7px 6px', textAlign: 'center', borderBottom: '1px solid #E5E7EB' }}>{k.numerator}</td>
                <td style={{ padding: '7px 6px', textAlign: 'center', borderBottom: '1px solid #E5E7EB' }}>{k.denominator}</td>
                <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: '700', borderBottom: '1px solid #E5E7EB' }}>
                  {k.denominator > 0 ? `${k.percentage}%` : '—'}
                </td>
                <td style={{ padding: '7px 6px', textAlign: 'center', borderBottom: '1px solid #E5E7EB', fontSize: '9px' }}>
                  {k.target_direction === 'lower' ? '≤' : '≥'}{k.target}%
                </td>
                <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: '800', borderBottom: '1px solid #E5E7EB',
                  color: pass ? '#059669' : fail ? '#DC2626' : '#9CA3AF' }}>
                  {pass ? 'PASS' : fail ? 'FAIL' : k.status === 'proxy' ? 'PROXY' : 'N/A'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Action Items */}
      {(() => {
        const issues = kpis.filter(([, k]) => k.meets_target === false || k.status === 'insufficient_data')
        if (issues.length === 0) return null
        return (
          <>
            <h2 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#0D9488', marginBottom: '8px' }}>
              Action Items
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#FEF2F2' }}>
                  <th style={{ padding: '6px', textAlign: 'left', fontWeight: '700', borderBottom: '1px solid #FECACA' }}>KPI</th>
                  <th style={{ padding: '6px', textAlign: 'left', fontWeight: '700', borderBottom: '1px solid #FECACA' }}>Issue</th>
                  <th style={{ padding: '6px', textAlign: 'left', fontWeight: '700', borderBottom: '1px solid #FECACA' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(([id, k]) => (
                  <tr key={id}>
                    <td style={{ padding: '6px', fontWeight: '700', borderBottom: '1px solid #E5E7EB', verticalAlign: 'top' }}>{id}</td>
                    <td style={{ padding: '6px', borderBottom: '1px solid #E5E7EB', verticalAlign: 'top', color: '#DC2626', fontWeight: '600' }}>
                      {k.status === 'insufficient_data' ? 'Cannot calculate' : `Below target (${k.percentage}% vs ${k.target_direction === 'lower' ? '≤' : '≥'}${k.target}%)`}
                    </td>
                    <td style={{ padding: '6px', borderBottom: '1px solid #E5E7EB', verticalAlign: 'top' }}>
                      {k.status === 'insufficient_data'
                        ? `Missing: ${(k.missing_fields || []).join(', ')}`
                        : k.gap_patients > 0 ? `${k.gap_patients} patient${k.gap_patients > 1 ? 's' : ''} gap to reach target` : ''
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )
      })()}

      {/* Data Quality Summary */}
      <h2 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#0D9488', marginBottom: '8px' }}>
        Data Completeness — {Math.round(dq.overall_score || 0)}% Average
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#F0F4F8' }}>
            <th style={{ padding: '5px 6px', textAlign: 'left', fontWeight: '700' }}>Field</th>
            <th style={{ padding: '5px 6px', textAlign: 'center', fontWeight: '700' }}>Status</th>
            <th style={{ padding: '5px 6px', textAlign: 'center', fontWeight: '700' }}>Population</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(dq.fields || {}).map(([name, info], i) => (
            <tr key={name} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
              <td style={{ padding: '4px 6px', borderBottom: '1px solid #E5E7EB' }}>{name}</td>
              <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #E5E7EB',
                color: info.status === 'good' ? '#059669' : info.status === 'partial' ? '#D97706' : info.status === 'poor' ? '#DC2626' : '#9CA3AF',
                fontWeight: '700' }}>
                {info.status === 'missing' ? 'NOT FOUND' : info.status.toUpperCase()}
              </td>
              <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '1px solid #E5E7EB' }}>
                {info.status === 'missing' ? '—' : `${info.populated_pct}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#999' }}>
        <span>Jawda KPI Platform by TriZodiac — Internal Readiness Report</span>
        <span>Powered by TriZodiac — DOH Guidance V2 2026</span>
        <span>{results.total_records?.toLocaleString()} records processed</span>
      </div>
    </div>
  )
})

PrintReport.displayName = 'PrintReport'
export default PrintReport
