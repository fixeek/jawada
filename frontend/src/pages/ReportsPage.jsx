import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileText, Download, CalendarDays } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

export default function ReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(null)

  useEffect(() => {
    axios.get(`${BASE}/api/clinic/dashboard`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  async function downloadPDF(quarter) {
    setGenerating(quarter)
    try {
      const form = new FormData()
      form.append('quarter', quarter)
      const res = await axios.post(`${BASE}/api/clinic/report/pdf`, form, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `Jawda-KPI-${data?.facility_name?.replace(/\s/g, '-') || 'Clinic'}-${quarter.replace(/\s/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('PDF generation failed. Please try again.')
    } finally {
      setGenerating(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-navy-200 border-t-navy-500 rounded-full animate-spin" />
      </div>
    )
  }

  const history = data?.history || {}
  const quarters = Object.keys(history).sort().reverse()

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl flex items-center justify-center shadow-card">
            <FileText size={24} className="text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-navy-500">Reports</h1>
            <p className="text-sm text-gray-500">Generate branded PDF reports for management and DOH auditors</p>
          </div>
        </div>

        {quarters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
            <FileText size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-navy-500 mb-1">No data available</p>
            <p className="text-xs text-gray-500">Upload and calculate KPI data to generate reports.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quarters.map(q => {
              const qData = history[q]
              const summary = qData?.jawda_summary || {}
              const meeting = summary.meeting_target || 0
              const na = summary.not_applicable || 0
              const verdict = summary.verdict || 'not_ready'
              const verdictLabel = { ready: 'Ready', attention: 'Attention', not_ready: 'Not Ready' }[verdict]
              const verdictColor = { ready: 'text-emerald-700 bg-emerald-50', attention: 'text-amber-700 bg-amber-50', not_ready: 'text-red-600 bg-red-50' }[verdict]
              const isGenerating = generating === q

              return (
                <div key={q} className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 flex items-center gap-5">
                  <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CalendarDays size={20} className="text-navy-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-navy-500">{q}</h3>
                    <p className="text-[10px] text-gray-500">
                      {meeting}/8 passing · {(qData?.total_records || 0).toLocaleString()} records
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-lg ${verdictColor}`}>
                    {verdictLabel}
                  </span>
                  <button onClick={() => downloadPDF(q)} disabled={isGenerating}
                    className="flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl
                      bg-gradient-to-r from-navy-500 to-navy-400 text-white shadow-card
                      hover:shadow-elevated transition-all disabled:opacity-50">
                    {isGenerating
                      ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                      : <><Download size={14} /> Download PDF</>}
                  </button>
                </div>
              )
            })}

            <div className="mt-6 bg-navy-50/30 rounded-2xl border border-navy-100/30 p-5">
              <h3 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-2">What's in the report?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px] text-gray-600">
                {['Executive Summary', 'Readiness Verdict', 'All 8 KPI Results',
                  'Pass/Fail per KPI', 'Action Plan', 'Quarter History',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 mt-3">
                Reports include ADHICS V2 compliance badge and DOH Guidance V2 2026 reference.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
