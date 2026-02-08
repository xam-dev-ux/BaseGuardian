import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut, ExternalLink } from 'lucide-react'
import { AGENT_WALLET } from '../config/wagmi'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <header className="border-b border-base-gray bg-base-dark/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="BaseGuardian" className="w-12 h-12 rounded-lg" />
          <div>
            <h1 className="text-xl font-bold text-white">BaseGuardian</h1>
            <p className="text-xs text-gray-400">Security Console</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={`https://basescan.org/address/${AGENT_WALLET}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
          >
            <span className="hidden sm:inline">Agent:</span>
            <code className="text-base-blue">{shortAddress(AGENT_WALLET)}</code>
            <ExternalLink className="w-3 h-3" />
          </a>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="bg-base-gray px-3 py-2 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-white">{shortAddress(address!)}</span>
              </div>
              <button
                onClick={() => disconnect()}
                className="p-2 text-gray-400 hover:text-white hover:bg-base-gray rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="flex items-center gap-2 bg-base-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
