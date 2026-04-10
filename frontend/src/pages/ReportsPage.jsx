import { FileText, Download, Plus } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl flex items-center justify-center shadow-card">
            <FileText size={24} className="text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-navy-500">Reports</h1>
            <p className="text-sm text-gray-500">Generate and download branded PDF reports</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <FileText size={28} className="text-violet-400" />
          </div>
          <h2 className="text-lg font-black text-navy-500 mb-2">Coming Soon</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Branded PDF reports with your clinic logo, executive summary, KPI results,
            trend charts, and action plan — ready for management meetings and DOH audits.
          </p>
        </div>
      </div>
    </div>
  )
}
