import { useState } from 'react'
import { Mail, Lock, AlertCircle, ChevronRight, Sparkles, Shield, Activity, Building } from 'lucide-react'
import { useAuth } from '../utils/auth'
import { getErrorMessage } from '../utils/errors'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white bg-mesh flex relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-teal-50/80 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-navy-50/60 to-transparent rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* LEFT — Brand & info */}
            <div className="hidden lg:block">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 text-xs font-bold px-4 py-2 rounded-full mb-6 border border-teal-100/60 shadow-sm">
                <Sparkles size={13} className="text-teal-500" />
                Outpatient Medical Centers
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-navy-500 mb-5 tracking-tight leading-[1.1]">
                Jawda KPI
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 block">Reporting</span>
              </h1>
              <p className="text-gray-500 text-base leading-relaxed mb-10 max-w-md">
                Sign in to access your clinic's Jawda compliance dashboard,
                upload data, and manage quarterly DOH submissions.
              </p>

              <div className="grid grid-cols-1 gap-3 mb-8">
                {[
                  { icon: Shield, label: 'ADHICS Compliant', sub: 'UAE data residency' },
                  { icon: Activity, label: 'DOH V2 2026', sub: 'Latest Jawda guidance' },
                  { icon: Building, label: 'Multi-Clinic', sub: 'Per-facility isolation' },
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
            </div>

            {/* RIGHT — Login form */}
            <div>
              {/* Mobile logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-300 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-glow">
                  <span className="text-white text-lg font-black">J</span>
                </div>
                <h1 className="text-2xl font-black text-navy-500">Jawda KPI</h1>
                <p className="text-xs text-gray-400">by TriZodiac</p>
              </div>

              <div className="relative">
                <div className="absolute -inset-px bg-gradient-to-b from-teal-200/20 via-transparent to-navy-100/20 rounded-[21px]" />
                <div className="relative bg-white rounded-[20px] shadow-elevated border border-gray-100/80 p-8">
                  <h2 className="text-xl font-black text-navy-500 mb-1">Sign In</h2>
                  <p className="text-xs text-gray-500 mb-6">Enter your credentials to continue</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-navy-500 mb-2 uppercase tracking-wider">Email</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          required
                          placeholder="you@clinic.ae"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full bg-navy-50/40 border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm
                            focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white
                            placeholder:text-gray-400 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-navy-500 mb-2 uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full bg-navy-50/40 border border-gray-200/80 rounded-xl pl-10 pr-4 py-3 text-sm
                            focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/15 focus:bg-white
                            placeholder:text-gray-400 transition-all font-medium"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex gap-3 bg-red-50 border border-red-100 rounded-xl p-4 animate-slide-up">
                        <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-4 rounded-xl flex items-center justify-center gap-2.5
                        font-bold text-sm transition-all duration-300
                        ${loading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-navy-500 via-navy-400 to-navy-500 bg-[length:200%_100%] text-white shadow-elevated hover:shadow-card-hover hover:bg-right'
                        }`}
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>Sign In <ChevronRight size={16} /></>
                      )}
                    </button>
                  </form>

                  <p className="text-[10px] text-gray-400 text-center mt-4 font-medium">
                    Need access? Contact your clinic administrator.
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-[11px] text-gray-400 font-medium">
                  Powered by TriZodiac · ADHICS Compliant · UAE North
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
