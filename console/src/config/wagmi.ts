import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: 'BaseGuardian Console' }),
  ],
  transports: {
    [base.id]: http(),
  },
})

// Contract addresses
export const CERTIFICATION_CONTRACT = '0x961711BD6f9921A4ccfA778ac0d14d553dF30be8'
export const AGENT_WALLET = '0x85e7fc9c7e3834d9be8d60d1e3718a24d1f96678'

// Contract ABI (challenge function)
export const CERTIFICATION_ABI = [
  {
    name: 'challenge',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: '_contractAddress', type: 'address' }],
    outputs: [],
  },
  {
    name: 'getCertification',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_contractAddress', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'contractAddress', type: 'address' },
          { name: 'guardian', type: 'address' },
          { name: 'ipfsHash', type: 'string' },
          { name: 'riskScore', type: 'uint256' },
          { name: 'stakeAmount', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'active', type: 'bool' },
          { name: 'challengeCount', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'isCertified',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_contractAddress', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'CHALLENGE_BOND',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const
