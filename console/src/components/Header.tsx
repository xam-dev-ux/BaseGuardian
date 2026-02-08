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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Mobile: stack vertically, Desktop: horizontal */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo + Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src="/logo.png" alt="BaseGuardian" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">BaseGuardian</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Security Console</p>
            </div>
          </div>

          {/* Right side: Agent (hidden on mobile) + Wallet */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Agent address - hidden on mobile */}
            <a
              href={`https://basescan.org/address/${AGENT_WALLET}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
            >
              <span>Agent:</span>
              <code className="text-base-blue">{shortAddress(AGENT_WALLET)}</code>
              <ExternalLink className="w-3 h-3" />
            </a>

            {isConnected ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="bg-base-gray px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs sm:text-sm text-white">{shortAddress(address!)}</span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-base-gray rounded-lg transition"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="flex items-center gap-1.5 sm:gap-2 bg-base-blue hover:bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-sm"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Connect</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
