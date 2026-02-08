import { Activity, AlertTriangle, CheckCircle, Eye } from 'lucide-react'
import type { DailyStats } from '../types'

interface StatsProps {
  stats: DailyStats | null
  loading: boolean
}

export function Stats({ stats, loading }: StatsProps) {
  const items = [
    {
      label: 'Contracts Scanned',
      value: stats?.contracts_scanned ?? 0,
      icon: Activity,
      color: 'text-base-blue',
      bg: 'bg-base-blue/10',
    },
    {
      label: 'Scams Detected',
      value: stats?.scams_detected ?? 0,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Safe Certified',
      value: stats?.safe_certified ?? 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Warnings Issued',
      value: stats?.warnings_issued ?? 0,
      icon: Eye,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-base-gray rounded-xl p-4 border border-gray-800"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`${item.bg} p-2 rounded-lg`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {loading ? (
              <div className="h-8 w-16 bg-gray-700 rounded animate-pulse" />
            ) : (
              item.value.toLocaleString()
            )}
          </div>
          <div className="text-sm text-gray-400">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
