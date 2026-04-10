import { useState, useEffect } from 'react'
import axios from 'axios'
import { Send, CheckCircle, Clock, AlertCircle, ExternalLink, Copy, CalendarDays } from 'lucide-react'
import { useI18n } from '../utils/i18n'

const BASE = import.meta.env.VITE_API_URL || ''

const STATUS_STEPS = [
  { value: 'calculated', label: 'Calculated', color: 'bg-blue-400', textColor: 'text-blue-700', bg: 'bg-blue-50' },
  { value: 'under_review', label: 'Under Review', color: 'bg-amber-400', textColor: 'text-amber-700', bg: 'bg-amber-50' },
  { value: 'approved', label: 'Approved', color: 'bg-violet-400', textColor: 'text-violet-700', bg: 'bg-violet-50' },
  { value: 'submitted', label: 'Submitted to DOH', color: 'bg-teal-400', textColor: 'text-teal-700', bg: 'bg-teal-50' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50' },
]

function getStatusIdx(status) {
  return STATUS_STEPS.findIndex(s => s.value === status)
}

export default function SubmissionsPage() {
  const { t } = useI18n()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  function loadData() {
    axios.get(`${BASE}/api/clinic/dashboard`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  async function advanceStatus(quarter, newStatus) {
    try {
      await axios.post(`${BASE}/api/clinic/submission`, { quarter, status: newStatus, notes: '' })
      loadData()
    } catch (e) {}
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl flex items-center justify-center shadow-card">
            <Send size={24} className="text-teal-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-navy-500">{t('submissions.title')}</h1>
            <p className="text-sm text-gray-500">{t('submissions.subtitle')}</p>
          </div>
        </div>

        {quarters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
            <Send size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-navy-500 mb-1">No submissions yet</p>
            <p className="text-xs text-gray-500">Upload and calculate KPI data to start tracking submissions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quarters.map(q => {
              const qData = history[q]
              const summary = qData?.jawda_summary || {}
              const submission = qData?.submission
              const currentStatus = submission?.status || 'calculated'
              const currentIdx = getStatusIdx(currentStatus)
              const nextStep = currentIdx < STATUS_STEPS.length - 1 ? STATUS_STEPS[currentIdx + 1] : null
              const meeting = summary.meeting_target || 0
              const na = summary.not_applicable || 0

              return (
                <div key={q} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                  {/* Quarter header */}
                  <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center">
                        <CalendarDays size={18} className="text-navy-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-navy-500">{q}</h3>
                        <p className="text-[10px] text-gray-500">
                          {meeting}/8 passing · {qData?.total_records?.toLocaleString() || '—'} records
                        </p>
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold px-3 py-1 rounded-lg border ${
                      STATUS_STEPS[currentIdx]?.textColor || 'text-gray-500'
                    } ${STATUS_STEPS[currentIdx]?.bg || 'bg-gray-50'} border-current/20`}>
                      {STATUS_STEPS[currentIdx]?.label || 'Unknown'}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-1 mb-3">
                      {STATUS_STEPS.map((step, i) => (
                        <div key={step.value} className={`h-2 flex-1 rounded-full transition-all ${
                          i <= currentIdx ? step.color : 'bg-gray-100'
                        }`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider">
                      {STATUS_STEPS.map((step, i) => (
                        <span key={step.value} className={i <= currentIdx ? 'text-navy-500' : 'text-gray-300'}>
                          {t(`submissions.${step.value}`, step.label)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] text-gray-400">
                      {submission?.updated_by && (
                        <span>Last updated by {submission.updated_by}</span>
                      )}
                      {submission?.updated_at && (
                        <span>{new Date(submission.updated_at).toLocaleDateString('en-GB')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {nextStep && (
                        <button onClick={() => advanceStatus(q, nextStep.value)}
                          className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-lg border border-teal-100 transition-colors">
                          {t('submissions.mark_as')} {t(`submissions.${nextStep.value}`, nextStep.label)}
                        </button>
                      )}
                      {currentStatus === 'accepted' && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                          DOH Accepted
                        </span>
                      )}
                      <a href="https://bpmweb.doh.gov.ae" target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold text-navy-500 hover:text-navy-600 bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors inline-flex items-center gap-1.5">
                        <ExternalLink size={11} /> {t('submissions.doh_portal')}
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
