import { Users, User } from 'lucide-react'

export default function DoctorBreakdown({ data }) {
  if (!data?.available || !data?.doctors?.length) {
    if (data === undefined) return null // No data at all
    return null
  }

  const maxPatients = Math.max(...data.doctors.map(d => d.patient_count))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg flex items-center justify-center">
            <Users size={14} className="text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-500">Doctor Breakdown</h3>
            <p className="text-[10px] text-gray-500">{data.total_doctors} doctor{data.total_doctors !== 1 ? 's' : ''} · by patient volume</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {data.doctors.map((doc, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <User size={12} className="text-navy-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-navy-500 truncate">{doc.name}</span>
                <span className="text-[10px] text-gray-500 font-medium flex-shrink-0 ml-2">{doc.patient_count} visits</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full transition-all"
                  style={{ width: `${(doc.patient_count / maxPatients) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
