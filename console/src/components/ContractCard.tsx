import { ExternalLink, Shield, AlertTriangle, XCircle, Clock, Award, Link2 } from 'lucide-react'
import type { ContractAnalysis } from '../types'

interface ContractCardProps {
  contract: ContractAnalysis
  onClick: () => void
  showCertification?: boolean
}

export function ContractCard({ contract, onClick, showCertification }: ContractCardProps) {
  const shortAddress = `${contract.contract_address.slice(0, 10)}...${contract.contract_address.slice(-8)}`

  const getClassificationStyle = () => {
    switch (contract.classification) {
      case 'SAFE':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: 'text-green-500',
          icon: Shield,
        }
      case 'SCAM':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-500',
          icon: XCircle,
        }
      default:
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-500',
          icon: AlertTriangle,
        }
    }
  }

  const style = getClassificationStyle()
  const Icon = style.icon

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const cert = contract.certification

  return (
    <div
      onClick={onClick}
      className={`${style.bg} ${style.border} border rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${style.text}`} />
          <span className={`text-sm font-semibold ${style.text}`}>
            {contract.classification}
          </span>
        </div>
        <a
          href={`https://basescan.org/address/${contract.contract_address}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-gray-400 hover:text-white transition"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="mb-3">
        <code className="text-white font-mono text-sm">{shortAddress}</code>
        {contract.is_verified && (
          <span className="ml-2 text-xs bg-base-blue/20 text-base-blue px-2 py-0.5 rounded">
            Verified
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Safety Score</div>
            <div className={`text-lg font-bold ${getScoreColor(contract.risk_score)}`}>
              {contract.risk_score}/100
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Confidence</div>
            <div className="text-lg font-bold text-white">
              {contract.confidence}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {formatDate(contract.analyzed_at || contract.created_at)}
        </div>
      </div>

      {/* Show certification info when in certifications tab */}
      {showCertification && cert && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-500 font-medium">Certified On-Chain</span>
            <span className="text-xs text-gray-500">• Stake: {cert.stake_eth} ETH</span>
          </div>
          <div className="flex gap-2">
            <a
              href={cert.basescan_tx}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-base-blue hover:underline"
            >
              <Link2 className="w-3 h-3" />
              BaseScan TX
            </a>
            <a
              href={cert.ipfs_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-base-blue hover:underline"
            >
              <Link2 className="w-3 h-3" />
              IPFS Report
            </a>
          </div>
        </div>
      )}

      {/* Show threats when not in certifications tab */}
      {!showCertification && contract.threats.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Threats ({contract.threats.length})</div>
          <div className="text-sm text-gray-300 line-clamp-1">
            {contract.threats[0]}
          </div>
        </div>
      )}
    </div>
  )
}
