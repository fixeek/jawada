import { useState, useRef } from 'react'
import { Upload, FileText, ChevronRight, AlertCircle, Shield, Activity, BarChart3,
         Sparkles, ChevronDown, Target, FileWarning, ClipboardList, CheckCircle,
         AlertTriangle, ArrowLeft, Columns, CalendarDays, X, Clock, FileSpreadsheet, Receipt } from 'lucide-react'
import { api } from '../utils/api'
import { getErrorMessage } from '../utils/errors'

/* ── File Slot Component ─────────────────────────────────────────────── */

function FileSlot({ label, description, required, icon: Icon, file, onFile, onClear, status }) {
  const ref = useRef()
  const [drag, setDrag] = useState(false)

  return (
    <div className={`relative border-2 rounded-xl p-4 transition-all duration-200 ${
      drag ? 'border-teal-400 bg-teal-50/50' :
      file ? 'border-teal-300/60 bg-teal-50/20' :
      'border-dashed border-gray-200 hover:border-teal-300/40 hover:bg-teal-50/10'
    }`}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]) }}
    >
      <input ref={ref} type="file" accept=".csv,.xlsx,.xls" className="hidden"
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]) }} />

      {file ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-navy-500 truncate">{file.name}</p>
            <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(0)} KB
              {status && <span className={`ml-2 font-bold ${status.valid ? 'text-teal-600' : 'text-red-500'}`}>
                {status.valid ? `${status.rows?.toLocaleString()} rows` : status.error}
              </span>}
            </p>
          </div>
          <button onClick={onClear} className="text-gray-400 hover:text-red-500 transition-colors p-1">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => ref.current.click()}>
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-navy-500">
              {label}
              {required && <span className="text-red-400 ml-1">*</span>}
            </p>
            <p className="text-[10px] text-gray-500">{description}</p>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{required ? 'Required' : 'Optional'}</span>
        </div>
      )}
    </div>
  )
}

/* ── Main Upload Page ───────────────────────────────────────────────── */

export default function UploadPage({ onResults, facility: facilityProp }) {
  // Current quarter files
  const [files, setFiles] = useState({ kpiData: null, visitDetails: null, timeData: null, eclaims: null })
  // Previous quarter files
  const [prevFiles, setPrevFiles] = useState({ kpiData: null, visitDetails: null, timeData: null, eclaims: null })
  const [showPrev, setShowPrev] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // Step 2 state — facility comes from logged-in user
  const [preview, setPreview]     = useState(null)
  const [facility, setFacility]   = useState(facilityProp || '')
  const [quarter, setQuarter]     = useState('')
  const [calculating, setCalculating] = useState(false)

  function setFile(slot, file) {
    setFiles(prev => ({ ...prev, [slot]: file }))
  }
  function clearFile(slot) {
    setFiles(prev => ({ ...prev, [slot]: null }))
  }
  function setPrevFile(slot, file) {
    setPrevFiles(prev => ({ ...prev, [slot]: file }))
  }
  function clearPrevFile(slot) {
    setPrevFiles(prev => ({ ...prev, [slot]: null }))
  }
  function reset() {
    setFiles({ kpiData: null, visitDetails: null, timeData: null, eclaims: null })
    setPrevFiles({ kpiData: null, visitDetails: null, timeData: null, eclaims: null })
    setShowPrev(false); setPreview(null); setError(null); setFacility(''); setQuarter('')
  }

  const hasAnyFile = Object.values(files).some(f => f !== null)
  const hasAnyPrev = Object.values(prevFiles).some(f => f !== null)

  // Step 1: Validate all files
  async function handleValidate() {
    if (!hasAnyFile) { setError('Please upload at least one file.'); return }
    setLoading(true); setError(null)
    try {
      const result = await api.validateMulti({
        kpiData: files.kpiData,
        visitDetails: files.visitDetails,
        timeData: files.timeData,
        eclaims: files.eclaims,
        prevKpiData: prevFiles.kpiData,
        prevVisitDetails: prevFiles.visitDetails,
        prevTimeData: prevFiles.timeData,
        prevEclaims: prevFiles.eclaims,
      })
      setPreview(result)
      if (result.quarters_detected?.length > 0) {
        setQuarter(result.quarters_detected[0].quarter)
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Validation failed. Check your files and try again.'))
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Calculate
  async function handleCalculate() {
    if (!facility.trim()) { setError('Please enter a facility name.'); return }
    setCalculating(true); setError(null)
    try {
      const result = await api.calculateMulti(preview.session_id, quarter, facility)
      onResults(result.results)
    } catch (err) {
      setError(getErrorMessage(err, 'Calculation failed. Please try again.'))
    } finally {
      setCalculating(false)
    }
  }

  // ── Step 2: Preview ──────────────────────────────────────────────────
  if (preview) {
    const q = preview.quarters_detected || []
    const w = preview.warnings || []
    const yrs = preview.years_detected || []
    const dateRange = preview.date_range
    const fileResults = preview.files || {}
    const validCount = Object.values(fileResults).filter(f => f.valid).length

    return (
      <div className="min-h-screen">
        <div className="p-6 sm:p-10">
          <div className="w-full max-w-5xl mx-auto animate-fade-in">

            <div className="flex items-center gap-3 mb-8">
              <button onClick={reset} className="text-gray-400 hover:text-navy-500 transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-black text-navy-500 tracking-tight">Files Validated</h1>
                <p className="text-sm text-gray-500">
                  {validCount} file{validCount > 1 ? 's' : ''} ready
                  {dateRange && <span> · {dateRange.earliest} — {dateRange.latest}</span>}
                </p>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                    <FileText size={18} className="text-teal-500" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-navy-500">{preview.total_rows?.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 font-semibold">Total Records</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Columns size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-navy-500">{validCount}</div>
                    <div className="text-[10px] text-gray-500 font-semibold">Files Valid</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                    <CalendarDays size={18} className="text-violet-500" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-navy-500">{q.length || '—'}</div>
                    <div className="text-[10px] text-gray-500 font-semibold">{q.length === 1 ? 'Quarter' : 'Quarters'}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <CalendarDays size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-navy-500">{yrs.length > 0 ? yrs.map(y => y.year).join(', ') : '—'}</div>
                    <div className="text-[10px] text-gray-500 font-semibold">{yrs.length === 1 ? 'Year' : 'Years'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* File status per slot */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 mb-6">
              <h3 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-3">Uploaded Files</h3>
              <div className="space-y-2">
                {Object.entries(fileResults).map(([slot, info]) => (
                  <div key={slot} className="flex items-center gap-3 text-xs bg-navy-50/30 rounded-lg px-4 py-2.5">
                    <CheckCircle size={14} className={info.valid ? 'text-teal-500' : 'text-red-400'} />
                    <span className="font-bold text-navy-500 w-24">{slot.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                    <span className="text-gray-600 truncate flex-1">{info.filename}</span>
                    <span className="text-gray-500 font-medium">{info.valid ? `${info.rows?.toLocaleString()} rows` : info.error}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {w.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 space-y-1.5">
                {w.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-medium">{warning}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Configure & Calculate */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
              <h3 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-4">Configure & Calculate</h3>
              <div className={`grid ${facilityProp ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-5`}>
                {!facilityProp && (
                  <div>
                    <label className="block text-[11px] font-bold text-navy-500 mb-2 uppercase tracking-wider">Facility Name</label>
                    <input type="text" placeholder="e.g. Al Noor Clinic" value={facility}
                      onChange={e => setFacility(e.target.value)}
                      className="w-full bg-navy-50/40 border border-gray-200/80 rounded-xl px-4 py-3 text-sm
                        focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white
                        placeholder:text-gray-400 transition-all font-medium" />
                  </div>
                )}
                {facilityProp && (
                  <div className="bg-teal-50/40 border border-teal-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="text-[11px] font-bold text-navy-500 uppercase tracking-wider">Facility:</div>
                    <div className="text-sm font-bold text-navy-500">{facilityProp}</div>
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-bold text-navy-500 mb-2 uppercase tracking-wider">
                    Quarter {q.length <= 1 && '(auto-detected)'}
                  </label>
                  {q.length > 1 ? (
                    <select value={quarter} onChange={e => setQuarter(e.target.value)}
                      className="w-full bg-navy-50/40 border border-gray-200/80 rounded-xl px-4 py-3 text-sm
                        focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 transition-all font-medium">
                      {q.map(({ quarter: qLabel, record_count }) => (
                        <option key={qLabel} value={qLabel}>{qLabel} — {record_count.toLocaleString()} records</option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-navy-50/40 border border-gray-200/80 rounded-xl px-4 py-3 text-sm font-medium text-navy-500">
                      {q.length === 1 ? q[0].quarter : 'No dates detected — all data used'}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 flex gap-3 bg-red-50 border border-red-100 rounded-xl p-4 animate-slide-up">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <button onClick={handleCalculate} disabled={calculating || !facility.trim()}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2.5
                  font-bold text-sm transition-all duration-300
                  ${calculating || !facility.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-navy-500 via-navy-400 to-navy-500 bg-[length:200%_100%] text-white shadow-elevated hover:shadow-card-hover hover:bg-right'
                  }`}>
                {calculating ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Calculating {quarter ? `for ${quarter}` : ''}...</>
                ) : (
                  <>Calculate KPIs {quarter ? `for ${quarter}` : ''} <ChevronRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 1: Upload ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-teal-50/80 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-navy-50/60 to-transparent rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-6xl animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* LEFT — Hero */}
            <div className="lg:sticky lg:top-20">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 text-xs font-bold px-4 py-2 rounded-full mb-6 border border-teal-100/60 shadow-sm">
                <Sparkles size={13} className="text-teal-500" />
                Outpatient Medical Centers
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-navy-500 mb-5 tracking-tight leading-[1.1]">
                Jawda KPI
                <span className="text-gradient block">Reporting</span>
              </h1>
              <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
                Upload your clinic data files. Get instant Jawda readiness
                assessment with pass/fail per KPI and a prioritised action plan.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { icon: Target,        label: 'Pass / Fail',     sub: 'Per-KPI vs DOH target' },
                  { icon: ClipboardList,  label: 'Action Plan',     sub: 'Prioritised fix list' },
                  { icon: FileWarning,    label: 'Data Gaps',       sub: '17-field completeness' },
                  { icon: BarChart3,      label: 'Submission File', sub: 'DOH-ready export' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3 bg-navy-50/40 rounded-xl p-3 border border-navy-100/30">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                      <Icon size={16} className="text-teal-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-navy-500">{label}</p>
                      <p className="text-[10px] text-gray-500">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Shield size={13} className="text-teal-400" />
                  <span>ADHICS Compliant</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity size={13} className="text-teal-400" />
                  <span>DOH V2 2026</span>
                </div>
              </div>
            </div>

            {/* RIGHT — 4 file slots */}
            <div>
              <div className="relative">
                <div className="absolute -inset-px bg-gradient-to-b from-teal-200/20 via-transparent to-navy-100/20 rounded-[21px]" />
                <div className="relative bg-white rounded-[20px] shadow-elevated border border-gray-100/80 p-7">

                  <h2 className="text-sm font-bold text-navy-500 mb-1">Upload Data Files</h2>
                  <p className="text-xs text-gray-500 mb-5">KPI Data is required. Other files add more KPI coverage.</p>

                  <div className="space-y-3">
                    <FileSlot
                      label="KPI Data (Excel)"
                      description="Monthly sheets with BMI, BP, HbA1c, eGFR, opioid flags"
                      required
                      icon={FileSpreadsheet}
                      file={files.kpiData}
                      onFile={f => setFile('kpiData', f)}
                      onClear={() => clearFile('kpiData')}
                    />
                    <FileSlot
                      label="Visit Details (CSV)"
                      description="ICD-10 codes, CPT codes, drugs per visit"
                      icon={FileText}
                      file={files.visitDetails}
                      onFile={f => setFile('visitDetails', f)}
                      onClear={() => clearFile('visitDetails')}
                    />
                    <FileSlot
                      label="Time Data (CSV)"
                      description="Registration & doctor check-in times for OMC003"
                      icon={Clock}
                      file={files.timeData}
                      onFile={f => setFile('timeData', f)}
                      onClear={() => clearFile('timeData')}
                    />
                    <FileSlot
                      label="E-Claims (CSV)"
                      description="Claims data for cross-validation"
                      icon={Receipt}
                      file={files.eclaims}
                      onFile={f => setFile('eclaims', f)}
                      onClear={() => clearFile('eclaims')}
                    />
                  </div>

                  {/* Previous Quarter — collapsible */}
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setShowPrev(!showPrev)}
                      className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-navy-500 transition-colors w-full"
                    >
                      <ChevronDown size={14} className={`transition-transform ${showPrev ? 'rotate-180' : ''}`} />
                      {showPrev ? 'Hide previous quarter files' : 'Add previous quarter for comparison'}
                      {hasAnyPrev && !showPrev && (
                        <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded font-bold ml-auto">
                          {Object.values(prevFiles).filter(f => f).length} file{Object.values(prevFiles).filter(f => f).length > 1 ? 's' : ''} added
                        </span>
                      )}
                    </button>

                    {showPrev && (
                      <div className="mt-3 space-y-3 animate-slide-up">
                        <p className="text-[10px] text-gray-500">Upload last quarter's files to see trend comparison on the dashboard.</p>
                        <FileSlot
                          label="Previous KPI Data (Excel)"
                          description="Last quarter's KPI Excel"
                          icon={FileSpreadsheet}
                          file={prevFiles.kpiData}
                          onFile={f => setPrevFile('kpiData', f)}
                          onClear={() => clearPrevFile('kpiData')}
                        />
                        <FileSlot
                          label="Previous Visit Details (CSV)"
                          description="Last quarter's visit details"
                          icon={FileText}
                          file={prevFiles.visitDetails}
                          onFile={f => setPrevFile('visitDetails', f)}
                          onClear={() => clearPrevFile('visitDetails')}
                        />
                        <FileSlot
                          label="Previous Time Data (CSV)"
                          description="Last quarter's wait time data"
                          icon={Clock}
                          file={prevFiles.timeData}
                          onFile={f => setPrevFile('timeData', f)}
                          onClear={() => clearPrevFile('timeData')}
                        />
                        <FileSlot
                          label="Previous E-Claims (CSV)"
                          description="Last quarter's claims data"
                          icon={Receipt}
                          file={prevFiles.eclaims}
                          onFile={f => setPrevFile('eclaims', f)}
                          onClear={() => clearPrevFile('eclaims')}
                        />
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="mt-4 flex gap-3 bg-red-50 border border-red-100 rounded-xl p-4 animate-slide-up">
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  )}

                  <button onClick={handleValidate} disabled={loading || !hasAnyFile}
                    className={`mt-5 w-full py-4 rounded-xl flex items-center justify-center gap-2.5
                      font-bold text-sm transition-all duration-300
                      ${loading || !hasAnyFile
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-navy-500 via-navy-400 to-navy-500 bg-[length:200%_100%] text-white shadow-elevated hover:shadow-card-hover hover:bg-right'
                      }`}>
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Validating files...</>
                    ) : (
                      <>Upload & Validate <ChevronRight size={16} /></>
                    )}
                  </button>

                  <p className="text-[10px] text-gray-400 text-center mt-3 font-medium">
                    Data stays in UAE (ADHICS compliant) · CSV and Excel accepted
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-auto mb-3" />
            <p className="text-[11px] text-gray-400 font-medium">
              Powered by TriZodiac — Abu Dhabi Department of Health Jawda Quality Programme
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
