import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId } from 'wagmi'
import { parseEther } from 'viem'
import { base } from 'wagmi/chains'
import {
  X,
  ExternalLink,
  Shield,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Loader2,
  Swords,
  RefreshCw,
} from 'lucide-react'
import type { ContractAnalysis } from '../types'
import { CERTIFICATION_CONTRACT, CERTIFICATION_ABI } from '../config/wagmi'

interface ContractDetailProps {
  contract: ContractAnalysis
  onClose: () => void
}

export function ContractDetail({ contract, onClose }: ContractDetailProps) {
  const [copied, setCopied] = useState(false)
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const isWrongChain = chainId !== base.id

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const copyAddress = () => {
    navigator.clipboard.writeText(contract.contract_address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSwitchToBase = () => {
    switchChain({ chainId: base.id })
  }

  const handleChallenge = () => {
    writeContract({
      address: CERTIFICATION_CONTRACT as `0x${string}`,
      abi: CERTIFICATION_ABI,
      functionName: 'challenge',
      args: [contract.contract_address as `0x${string}`],
      value: parseEther('0.001'),
      chainId: base.id,
    })
  }

  const handleRequestReview = () => {
    writeContract({
      address: CERTIFICATION_CONTRACT as `0x${string}`,
      abi: CERTIFICATION_ABI,
      functionName: 'challenge',
      chainId: base.id,
      args: [contract.contract_address as `0x${string}`],
      value: parseEther('0.001'),
    })
  }

  const getClassificationStyle = () => {
    switch (contract.classification) {
      case 'SAFE':
        return { bg: 'bg-green-500/10', text: 'text-green-500', icon: Shield }
      case 'SCAM':
        return { bg: 'bg-red-500/10', text: 'text-red-500', icon: XCircle }
      default:
        return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: AlertTriangle }
    }
  }

  const style = getClassificationStyle()
  const Icon = style.icon

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-base-gray rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-base-gray border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${style.bg} p-2 rounded-lg`}>
              <Icon className={`w-5 h-5 ${style.text}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Contract Analysis</h2>
              <p className={`text-sm ${style.text}`}>{contract.classification}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Address */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Contract Address</label>
            <div className="flex items-center gap-2 bg-base-dark p-3 rounded-lg">
              <code className="text-white font-mono text-sm flex-1 break-all">
                {contract.contract_address}
              </code>
              <button
                onClick={copyAddress}
                className="p-2 text-gray-400 hover:text-white transition"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={`https://basescan.org/address/${contract.contract_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-white transition"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-base-dark p-4 rounded-lg text-center">
              <div className="text-sm text-gray-400 mb-1">Safety Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(contract.risk_score)}`}>
                {contract.risk_score}
              </div>
            </div>
            <div className="bg-base-dark p-4 rounded-lg text-center">
              <div className="text-sm text-gray-400 mb-1">Confidence</div>
              <div className="text-3xl font-bold text-white">{contract.confidence}%</div>
            </div>
            <div className="bg-base-dark p-4 rounded-lg text-center">
              <div className="text-sm text-gray-400 mb-1">Verified</div>
              <div className="text-3xl font-bold text-white">
                {contract.is_verified ? '✓' : '✗'}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Analysis</label>
            <div className="bg-base-dark p-4 rounded-lg">
              <p className="text-gray-300 text-sm leading-relaxed">{contract.explanation}</p>
            </div>
          </div>

          {/* Threats */}
          {contract.threats.length > 0 && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Threats Detected ({contract.threats.length})
              </label>
              <div className="space-y-2">
                {contract.threats.map((threat, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-200">{threat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certification Info */}
          {contract.certification && (
            <div className="border-t border-gray-700 pt-6">
              <label className="text-sm text-gray-400 mb-3 block">On-Chain Certification</label>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-green-400 font-medium">Certified Safe</span>
                  <span className="text-gray-400 text-sm">
                    • Stake: {contract.certification.stake_eth} ETH
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={contract.certification.basescan_tx}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-base-blue hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on BaseScan
                  </a>
                  <a
                    href={contract.certification.ipfs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-base-blue hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    IPFS Report
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Challenge Section - For SAFE certified contracts */}
          {contract.classification === 'SAFE' && contract.certification && (
            <div className="border-t border-gray-700 pt-6">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                <h3 className="text-yellow-500 font-semibold mb-2 flex items-center gap-2">
                  <Swords className="w-5 h-5" />
                  Challenge Certification
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  Think this contract was incorrectly certified as SAFE? Challenge it by posting a 0.001 ETH bond.
                </p>
                <p className="text-xs text-gray-400">
                  If your challenge is valid, you'll receive 50% of the guardian's stake + your bond back.
                </p>
              </div>

              {!isConnected ? (
                <p className="text-center text-gray-400 text-sm">
                  Connect your wallet to challenge this certification
                </p>
              ) : isWrongChain ? (
                <button
                  onClick={handleSwitchToBase}
                  disabled={isSwitching}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isSwitching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Switching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Switch to Base Network
                    </>
                  )}
                </button>
              ) : isSuccess ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                  <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-400 font-medium">Challenge submitted!</p>
                  <a
                    href={`https://basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-base-blue hover:underline"
                  >
                    View transaction
                  </a>
                </div>
              ) : (
                <button
                  onClick={handleChallenge}
                  disabled={isPending || isConfirming}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isPending ? 'Confirm in wallet...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Swords className="w-5 h-5" />
                      Challenge (0.001 ETH Bond)
                    </>
                  )}
                </button>
              )}

              {error && (
                <p className="text-red-400 text-sm mt-2 text-center">
                  Error: {error.message.slice(0, 100)}
                </p>
              )}
            </div>
          )}

          {/* Request Review Section - For SCAM/SUSPICIOUS contracts */}
          {(contract.classification === 'SCAM' || contract.classification === 'SUSPICIOUS') && (
            <div className="border-t border-gray-700 pt-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Request Manual Review
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  Think this contract was incorrectly classified as {contract.classification}? Request a manual review by posting a 0.001 ETH bond.
                </p>
                <p className="text-xs text-gray-400">
                  If the review determines this is a legitimate safe contract, you'll receive your bond back + potential certification.
                </p>
              </div>

              {!isConnected ? (
                <p className="text-center text-gray-400 text-sm">
                  Connect your wallet to request a review
                </p>
              ) : isWrongChain ? (
                <button
                  onClick={handleSwitchToBase}
                  disabled={isSwitching}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isSwitching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Switching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Switch to Base Network
                    </>
                  )}
                </button>
              ) : isSuccess ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                  <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-400 font-medium">Review requested!</p>
                  <a
                    href={`https://basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-base-blue hover:underline"
                  >
                    View transaction
                  </a>
                </div>
              ) : (
                <button
                  onClick={handleRequestReview}
                  disabled={isPending || isConfirming}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isPending ? 'Confirm in wallet...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Request Review (0.001 ETH Bond)
                    </>
                  )}
                </button>
              )}

              {error && (
                <p className="text-red-400 text-sm mt-2 text-center">
                  Error: {error.message.slice(0, 100)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
