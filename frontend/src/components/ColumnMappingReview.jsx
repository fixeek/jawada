import { useState } from 'react'
import { Columns, CheckCircle, XCircle, ChevronDown, RefreshCw } from 'lucide-react'

const FILE_ORDER = ['KPI Data', 'Visit Details', 'Time Data', 'E-Claims']

export default function ColumnMappingReview({ colMapping, availableColumns, fieldDefinitions, onChange }) {
  const [open, setOpen] = useState(false)

  if (!fieldDefinitions || !colMapping) return null

  // Group fields by file type
  const groups = {}
  for (const [key, def] of Object.entries(fieldDefinitions)) {
    const file = def.file || 'Other'
    if (!groups[file]) groups[file] = []
    groups[file].push({ key, ...def, detected: colMapping[key] || null })
  }

  const totalFields = Object.keys(fieldDefinitions).length
  const mappedFields = Object.values(colMapping).filter(Boolean).length
  const requiredFields = Object.values(fieldDefinitions).filter(d => d.required)
  const requiredMapped = requiredFields.filter(d => colMapping[d.label] || Object.entries(colMapping).find(([k]) => fieldDefinitions[k]?.required && colMapping[k])).length
  const requiredMappedCount = Object.entries(fieldDefinitions).filter(([k, d]) => d.required && colMapping[k]).length

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card mb-6 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Columns size={15} className="text-indigo-500" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-navy-500">Column Mapping</h3>
            <p className="text-[10px] text-gray-500">
              {mappedFields} of {totalFields} fields detected · {requiredMappedCount} of {requiredFields.length} required
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
            requiredMappedCount === requiredFields.length
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}>
            {requiredMappedCount === requiredFields.length ? 'All required mapped' : 'Review recommended'}
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 animate-slide-up">
          <p className="text-[10px] text-gray-500 mb-4">
            Review auto-detected column mappings below. If a column wasn't detected correctly, select the right one from the dropdown.
            Changes will be saved as your clinic's default mapping for future uploads.
          </p>

          {FILE_ORDER.filter(f => groups[f]).map(fileType => (
            <div key={fileType} className="mb-4 last:mb-0">
              <h4 className="text-[10px] font-bold text-navy-400 uppercase tracking-wider mb-2">{fileType}</h4>
              <div className="space-y-1.5">
                {groups[fileType].map(field => (
                  <div key={field.key} className="flex items-center gap-3 bg-navy-50/20 rounded-lg px-3 py-2">
                    {/* Field name */}
                    <div className="w-40 flex-shrink-0">
                      <span className="text-xs font-bold text-navy-500">{field.label}</span>
                      {field.required && <span className="text-red-400 ml-1 text-[10px]">*</span>}
                    </div>

                    {/* Status icon */}
                    {field.detected ? (
                      <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle size={13} className="text-gray-300 flex-shrink-0" />
                    )}

                    {/* Dropdown */}
                    <select
                      value={field.detected || ''}
                      onChange={e => {
                        const newMapping = { ...colMapping }
                        if (e.target.value) {
                          newMapping[field.key] = e.target.value
                        } else {
                          delete newMapping[field.key]
                        }
                        onChange(newMapping)
                      }}
                      className={`flex-1 text-xs rounded-lg px-2 py-1.5 border focus:outline-none focus:border-teal-400 ${
                        field.detected
                          ? 'bg-white border-gray-200 text-navy-500 font-medium'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      <option value="">— Not mapped —</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>

                    {/* KPI tags */}
                    <div className="flex gap-1 flex-shrink-0">
                      {field.kpis?.slice(0, 3).map(kpi => (
                        <span key={kpi} className="text-[8px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {kpi}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
