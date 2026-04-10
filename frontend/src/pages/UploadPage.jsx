import { useState, useRef } from 'react'
import { Upload, FileText, ChevronRight, AlertCircle, Shield, Activity,
         CheckCircle, AlertTriangle, ArrowLeft, Columns, CalendarDays, X,
         Clock, FileSpreadsheet, Receipt, History, CalendarPlus, RotateCcw } from 'lucide-react'
import { api } from '../utils/api'
import { getErrorMessage } from '../utils/errors'
import ColumnMappingReview from '../components/ColumnMappingReview'

/* ── File Slot Component ─────────────────────────────────────────────── */

function FileSlot({ label, description, required, icon: Icon, file, onFile, onClear }) {
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
            <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
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

/* ── Quarter options generator ──────────────────────────────────────── */

function generateQuarterOptions(existingQuarters) {
  const existing = new Set(existingQuarters)
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentQ = Math.ceil(currentMonth / 3)

  const options = []
  // Go back 3 years
  for (let y = currentYear; y >= currentYear - 3; y--) {
    for (let q = 4; q >= 1; q--) {
      // Skip future quarters
      if (y === currentYear && q > currentQ) continue
      const label = `Q${q} ${y}`
      options.push({
        value: label,
        label: label,
        exists: existing.has(label),
      })
    }
  }
  return options
}

/* ── Main Upload Page ───────────────────────────────────────────────── */

export default function UploadPage({ onResults, facility: facilityProp, existingQuarters = [] }) {
  const [mode, setMode] = useState(null) // null = picker, 'current' | 'historical'
  const [selectedQuarter, setSelectedQuarter] = useState('')
  const [files, setFiles] = useState({ kpiData: null, visitDetails: null, timeData: null, eclaims: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Step 2 state
  const [preview, setPreview] = useState(null)
  const [facility, setFacility] = useState(facilityProp || '')
  const [quarter, setQuarter] = useState('')
  const [colMapping, setColMapping] = useState(null)
  const [calculating, setCalculating] = useState(false)

  function setFile(slot, file) { setFiles(prev => ({ ...prev, [slot]: file })) }
  function clearFile(slot) { setFiles(prev => ({ ...prev, [slot]: null })) }

  function reset() {
    setFiles({ kpiData: null, visitDetails: null, timeData: null, eclaims: null })
    setPreview(null); setError(null); setQuarter('')
  }

  function goBack() {
    reset()
    setMode(null); setSelectedQuarter('')
  }

  const hasAnyFile = Object.values(files).some(f => f !== null)
  const quarterOptions = generateQuarterOptions(existingQuarters)

  // Step 1: Validate
  async function handleValidate() {
    if (!hasAnyFile) { setError('Please upload at least one file.'); return }
    setLoading(true); setError(null)
    try {
      const result = await api.validateMulti({
        kpiData: files.kpiData,
        visitDetails: files.visitDetails,
        timeData: files.timeData,
        eclaims: files.eclaims,
      })
      setPreview(result)
      if (result.col_mapping) setColMapping(result.col_mapping)
      // For historical upload, use the selected quarter; for current, auto-detect
      if (mode === 'historical' && selectedQuarter) {
        setQuarter(selectedQuarter)
      } else if (result.quarters_detected?.length > 0) {
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
      const result = await api.calculateMulti(preview.session_id, quarter, facility, colMapping)
      onResults(result.results)
    } catch (err) {
      setError(getErrorMessage(err, 'Calculation failed. Please try again.'))
    } finally {
      setCalculating(false)
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Step 2: Preview & Calculate
  // ────────────────────────────────────────────────────────────────────
  if (preview) {
    const q = preview.quarters_detected || []
    const w = preview.warnings || []
    const fileResults = preview.files || {}
    const validCount = Object.values(fileResults).filter(f => f.valid).length
    const dateRange = preview.date_range

    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
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
                  <div className="text-xl font-black text-navy-500">
                    {preview.years_detected?.length > 0 ? preview.years_detected.map(y => y.year).join(', ') : '—'}
                  </div>
                  <div className="text-[10px] text-gray-500 font-semibold">
                    {preview.years_detected?.length === 1 ? 'Year' : 'Years'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* File status */}
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

          {/* ID Mismatch Errors */}
          {(preview.id_warnings || []).filter(w => w.severity === 'error').length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 space-y-2">
              <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Data Quality Issues</p>
              {preview.id_warnings.filter(w => w.severity === 'error').map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium">{w.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Data Quality Warnings */}
          {(preview.data_quality_warnings || []).length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4 space-y-2">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Data Quality</p>
              {preview.data_quality_warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-medium">{w.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* General Warnings */}
          {w.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 mb-6 space-y-1.5">
              {w.map((warning, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-medium">{warning}</p>
                </div>
              ))}
            </div>
          )}

          {/* Column Mapping Review */}
          {preview.col_mapping && (
            <ColumnMappingReview
              colMapping={colMapping || preview.col_mapping}
              availableColumns={preview.available_columns || []}
              fieldDefinitions={preview.field_definitions || {}}
              onChange={setColMapping}
            />
          )}

          {/* Configure & Calculate */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h3 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-4">Configure & Calculate</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {facilityProp ? (
                <div className="bg-teal-50/40 border border-teal-100 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="text-[11px] font-bold text-navy-500 uppercase tracking-wider">Facility:</div>
                  <div className="text-sm font-bold text-navy-500">{facilityProp}</div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-navy-500 mb-2 uppercase tracking-wider">Facility Name</label>
                  <input type="text" placeholder="e.g. Al Noor Clinic" value={facility}
                    onChange={e => setFacility(e.target.value)}
                    className="w-full bg-navy-50/40 border border-gray-200/80 rounded-xl px-4 py-3 text-sm
                      focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white
                      placeholder:text-gray-400 transition-all font-medium" />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-navy-500 mb-2 uppercase tracking-wider">
                  Quarter {mode === 'historical' ? '(selected)' : q.length <= 1 ? '(auto-detected)' : ''}
                </label>
                {mode === 'historical' && selectedQuarter ? (
                  <div className="w-full bg-navy-50/40 border border-gray-200/80 rounded-xl px-4 py-3 text-sm font-medium text-navy-500">
                    {selectedQuarter}
                  </div>
                ) : q.length > 1 ? (
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
    )
  }

  // ────────────────────────────────────────────────────────────────────
  // Step 1: File Upload (after mode is selected)
  // ────────────────────────────────────────────────────────────────────
  if (mode) {
    return (
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={goBack} className="text-gray-400 hover:text-navy-500 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-navy-500 tracking-tight">
                {mode === 'historical' ? `Upload ${selectedQuarter} Data` : 'Upload Current Quarter'}
              </h1>
              <p className="text-sm text-gray-500">
                {facilityProp || 'Your clinic'} · {mode === 'historical' ? `Historical data for ${selectedQuarter}` : 'Quarter will be auto-detected from your data'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-elevated border border-gray-100/80 p-7">
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
              Data stays in UAE (ADHICS compliant) · CSV and Excel accepted ·{' '}
                <a href={`${import.meta.env.VITE_API_URL ?? ''}/api/template/download`}
                  className="text-teal-500 hover:text-teal-600 font-bold underline">
                  Download blank template
                </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────
  // Step 0: Choose upload mode
  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl flex items-center justify-center shadow-card">
            <Upload size={24} className="text-teal-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-navy-500">Upload & Calculate</h1>
            <p className="text-sm text-gray-500">{facilityProp || 'Your clinic'} · DOH Jawda V2 2026</p>
          </div>
        </div>

        {/* Two cards: Current Quarter vs Historical */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <button onClick={() => { setMode('current'); setSelectedQuarter('') }}
            className="bg-white rounded-2xl border-2 border-gray-100 shadow-card p-7 text-left
              hover:border-teal-300 hover:shadow-elevated transition-all group">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <CalendarPlus size={22} className="text-teal-500" />
            </div>
            <h2 className="text-lg font-black text-navy-500 mb-1">Current Quarter</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Upload this quarter's data files. The quarter will be auto-detected from dates in your data.
            </p>
          </button>

          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-card p-7 text-left">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center mb-4">
              <History size={22} className="text-blue-500" />
            </div>
            <h2 className="text-lg font-black text-navy-500 mb-1">Historical Quarter</h2>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Upload data for a past quarter to build your trend history.
            </p>
            <div className="flex gap-2">
              <select value={selectedQuarter}
                onChange={e => setSelectedQuarter(e.target.value)}
                className="flex-1 bg-navy-50/40 border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                  focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/15 font-medium text-navy-500">
                <option value="">Select quarter...</option>
                {quarterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}{opt.exists ? ' (re-upload)' : ''}
                  </option>
                ))}
              </select>
              <button onClick={() => selectedQuarter && setMode('historical')}
                disabled={!selectedQuarter}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  selectedQuarter
                    ? 'bg-gradient-to-r from-navy-500 to-navy-400 text-white shadow-card hover:shadow-elevated'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}>
                Go
              </button>
            </div>
          </div>
        </div>

        {/* Existing quarters */}
        {existingQuarters.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-8">
            <h3 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-3">Quarters on File</h3>
            <div className="flex flex-wrap gap-2">
              {existingQuarters.map(q => (
                <div key={q} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-50 border border-teal-100">
                  <CheckCircle size={12} className="text-teal-500" />
                  <span className="text-xs font-bold text-teal-700">{q}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-3">
              Select "Historical Quarter" above and pick a quarter to re-upload and update its data.
            </p>
          </div>
        )}

        {existingQuarters.length === 0 && (
          <div className="bg-navy-50/30 rounded-2xl border border-navy-100/30 p-6 mb-8">
            <h3 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-2">Getting Started</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              No data uploaded yet. Start with your <strong>current quarter</strong>, or use
              <strong> Historical Quarter</strong> to backfill older data and build your KPI trend history.
              Each quarter needs at least the <strong>KPI Data Excel</strong> file — Time Data, Visit Details,
              and E-Claims are optional but improve accuracy.
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: '1', label: 'Upload Files', sub: 'Drop your 1–4 data files', color: 'text-teal-500', bg: 'bg-teal-50' },
            { step: '2', label: 'Validate', sub: 'System checks format & columns', color: 'text-blue-500', bg: 'bg-blue-50' },
            { step: '3', label: 'Calculate KPIs', sub: 'All 8 DOH KPIs computed instantly', color: 'text-violet-500', bg: 'bg-violet-50' },
          ].map(({ step, label, sub, color, bg }) => (
            <div key={step} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 shadow-card p-4">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <span className={`text-sm font-black ${color}`}>{step}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-navy-500">{label}</p>
                <p className="text-[10px] text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-teal-400" />
            <span className="font-medium">ADHICS Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-teal-400" />
            <span className="font-medium">DOH V2 2026</span>
          </div>
        </div>
      </div>
    </div>
  )
}
