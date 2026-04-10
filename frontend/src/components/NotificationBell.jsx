import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Bell, Clock, AlertTriangle, TrendingDown, Send, CheckCircle, X } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || ''

const TYPE_CONFIG = {
  deadline_reminder: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  kpi_regression: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
  submission_update: { icon: Send, color: 'text-teal-500', bg: 'bg-teal-50' },
  data_quality_warning: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef()

  function load() {
    axios.get(`${BASE}/api/notifications`)
      .then(res => {
        setNotifications(res.data.notifications || [])
        setUnread(res.data.unread || 0)
      })
      .catch(() => {})
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000) // Refresh every 5 min
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function markAllRead() {
    axios.post(`${BASE}/api/notifications/read`)
      .then(() => { setUnread(0); load() })
      .catch(() => {})
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-gray-400 hover:text-navy-500 hover:bg-gray-100 transition-all">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold
            rounded-full flex items-center justify-center min-w-[18px] h-[18px] shadow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-modal border border-gray-100 z-50 overflow-hidden animate-scale-in">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-500">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="text-[10px] font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.deadline_reminder
                const Icon = cfg.icon
                return (
                  <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                    !n.is_read ? 'bg-blue-50/30' : ''
                  }`}>
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 ${cfg.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-navy-500">{n.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[9px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
