export interface ContractAnalysis {
  id: number
  contract_address: string
  deployer_address?: string
  source_code?: string
  is_verified: boolean
  risk_score: number
  classification: 'SAFE' | 'SUSPICIOUS' | 'SCAM'
  threats: string[]
  explanation: string
  confidence: number
  analyzed_at?: string
  created_at?: string
  tx_hash?: string
  block_number?: number
  // Certification data (when joined)
  certification?: Certification
}

export interface Certification {
  id: number
  contract_address: string
  certification_id?: number
  ipfs_hash: string
  stake_amount: string
  stake_eth?: string
  tx_hash: string
  eas_attestation_uid?: string
  created_at: string
  basescan_tx?: string
  ipfs_url?: string
}

export interface DailyStats {
  contracts_scanned: number
  scams_detected: number
  safe_certified: number
  warnings_issued: number
}

export interface AgentHealth {
  status: 'healthy' | 'unhealthy'
  uptime: number
  lastBlock: number
  walletBalance: string
  monitoring: boolean
}
