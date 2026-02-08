import { useState, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import { Header } from './components/Header'
import { Stats } from './components/Stats'
import { ContractCard } from './components/ContractCard'
import { ContractDetail } from './components/ContractDetail'
import type { ContractAnalysis, DailyStats, Certification } from './types'
import { RefreshCw, Filter, AlertTriangle, Award, Bell } from 'lucide-react'

const queryClient = new QueryClient()

// Data source: static JSON file exported from database
// Run: node scripts/export-console-data.mjs in BaseGuardian to update
const DATA_URL = '/data.json'

type TabType = 'analyses' | 'certifications' | 'alerts'

interface ExportData {
  exportedAt: string
  stats: DailyStats
  analyses: ContractAnalysis[]
  certifications: any[]
  scams: ContractAnalysis[]
}

function Dashboard() {
  const [contracts, setContracts] = useState<ContractAnalysis[]>([])
  const [certifications, setCertifications] = useState<(ContractAnalysis & { certification: Certification })[]>([])
  const [alerts, setAlerts] = useState<ContractAnalysis[]>([])
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [selectedContract, setSelectedContract] = useState<ContractAnalysis | null>(null)
  const [filter, setFilter] = useState<'all' | 'SAFE' | 'SUSPICIOUS' | 'SCAM'>('all')
  const [activeTab, setActiveTab] = useState<TabType>('analyses')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch from static JSON file
      const res = await fetch(DATA_URL)
      if (!res.ok) {
        throw new Error('Failed to load data')
      }

      const data: ExportData = await res.json()

      // Set last update time
      setLastUpdate(data.exportedAt)

      // Stats
      setStats(data.stats)

      // Analyses
      setContracts(data.analyses)

      // Certifications - map to include certification object
      const certsWithData = data.certifications.map((c: any) => ({
        ...c,
        certification: {
          id: c.id,
          contract_address: c.contract_address,
          certification_id: c.certification_id,
          ipfs_hash: c.ipfs_hash,
          stake_amount: c.stake_amount,
          stake_eth: c.stake_eth,
          tx_hash: c.tx_hash,
          eas_attestation_uid: c.eas_attestation_uid,
          created_at: c.created_at,
          basescan_tx: c.basescan_tx,
          ipfs_url: c.ipfs_url,
        },
      }))
      setCertifications(certsWithData)

      // Scam alerts
      setAlerts(data.scams)
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Failed to load data. The data file may not exist yet.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredContracts = contracts.filter(
    (c) => filter === 'all' || c.classification === filter
  )

  const filterCounts = {
    all: contracts.length,
    SAFE: contracts.filter((c) => c.classification === 'SAFE').length,
    SUSPICIOUS: contracts.filter((c) => c.classification === 'SUSPICIOUS').length,
    SCAM: contracts.filter((c) => c.classification === 'SCAM').length,
  }

  const getDisplayData = () => {
    switch (activeTab) {
      case 'certifications':
        return certifications
      case 'alerts':
        return alerts
      default:
        return filteredContracts
    }
  }

  const displayData = getDisplayData()

  return (
    <div className="min-h-screen bg-base-dark">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Dashboard</h2>
              {lastUpdate && (
                <p className="text-xs text-gray-500 mt-1">
                  Data exported: {new Date(lastUpdate).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Reload
            </button>
          </div>
          <Stats stats={stats} loading={loading} />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs - scrollable on mobile */}
        <div className="mb-6 border-b border-gray-700 overflow-x-auto">
          <div className="flex gap-1 sm:gap-4 min-w-max">
            <button
              onClick={() => setActiveTab('analyses')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === 'analyses'
                  ? 'border-base-blue text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Analyses ({contracts.length})
            </button>
            <button
              onClick={() => setActiveTab('certifications')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === 'certifications'
                  ? 'border-base-blue text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Certs ({certifications.length})
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === 'alerts'
                  ? 'border-base-blue text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Alerts ({alerts.length})
            </button>
          </div>
        </div>

        {/* Filter (only for analyses tab) */}
        {activeTab === 'analyses' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-white">Recent Analyses</h2>
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0 hidden sm:block" />
              <div className="flex bg-base-gray rounded-lg p-1 min-w-max">
                {(['all', 'SAFE', 'SUSPICIOUS', 'SCAM'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition whitespace-nowrap ${
                      filter === f
                        ? 'bg-base-blue text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f === 'all' ? 'All' : f} ({filterCounts[f]})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Headers */}
        {activeTab === 'certifications' && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Certified Contracts</h2>
            <p className="text-sm text-gray-400">On-chain certifications with stake</p>
          </div>
        )}
        {activeTab === 'alerts' && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">SCAM Alerts</h2>
            <p className="text-sm text-gray-400">Detected malicious contracts</p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-base-gray rounded-xl p-4 h-48 animate-pulse"
              />
            ))}
          </div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {activeTab === 'analyses' && `No contracts found with filter "${filter}"`}
            {activeTab === 'certifications' && 'No certifications yet'}
            {activeTab === 'alerts' && 'No SCAM alerts detected'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayData.map((contract) => (
              <ContractCard
                key={`${activeTab}-${contract.id}-${contract.contract_address}`}
                contract={contract}
                onClick={() => setSelectedContract(contract)}
                showCertification={activeTab === 'certifications'}
              />
            ))}
          </div>
        )}
      </main>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <ContractDetail
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-base-gray py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            🛡️ BaseGuardian - Keeping Base Safe, One Contract at a Time
          </p>
          <p className="mt-1">
            <a
              href="https://github.com/xam-dev-ux/BaseGuardian"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base-blue hover:underline"
            >
              GitHub
            </a>
            {' · '}
            <a
              href="https://twitter.com/xamaitena"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base-blue hover:underline"
            >
              Twitter
            </a>
            {' · '}
            <a
              href="https://basescan.org/address/0x961711BD6f9921A4ccfA778ac0d14d553dF30be8"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base-blue hover:underline"
            >
              Smart Contract
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
