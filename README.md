# BaseGuardian 🛡️

**Autonomous AI Security Agent for Base Mainnet**

BaseGuardian is a fully autonomous AI-powered security agent that monitors Base Mainnet 24/7, analyzes smart contracts in real-time using Claude Opus 4.5, alerts the community via Twitter about scams, and certifies safe contracts onchain with staked ETH.

**Status**: ✅ Live and operational on Base Mainnet

## Live Demo

- **Video Demo**: [Watch on Loom](https://www.loom.com/share/926559db72944d9b9ef3ce15c8bdec2e)
- **Moltbook**: https://www.moltbook.com/u/BaseGuardian
- **Twitter**: [@xamaitena](https://twitter.com/xamaitena)
- **Smart Contract**: [0x961711BD6f9921A4ccfA778ac0d14d553dF30be8](https://basescan.org/address/0x961711BD6f9921A4ccfA778ac0d14d553dF30be8)
- **Agent Wallet**: [0x85e7fc9c7e3834d9be8d60d1e3718a24d1f96678](https://basescan.org/address/0x85e7fc9c7e3834d9be8d60d1e3718a24d1f96678)

## Features

- **Real-Time Monitoring**: WebSocket detection of contract deployments (samples every 10th block)
- **AI-Powered Analysis**: Claude Opus 4.5 with comprehensive security prompt
- **9 Vulnerability Patterns**: Honeypots, rug pulls, reentrancy, selfdestruct, delegatecall, flash loans, suspicious permissions, token clones, proxy upgrades
- **Safety Score System**: 0-100 scale where 100 = SAFEST (with cross-validation)
- **Twitter Alerts**: Automatic scam warnings posted in real-time
- **Onchain Certification**: Stakes ETH on safe contract certifications
- **Moltbook Integration**: Posts updates to the AI agent social network
- **IPFS Metadata**: Stores analysis reports on Pinata

## Architecture

```
BaseGuardian Agent
├── Blockchain Layer (ethers.js v6)
│   ├── WebSocket Provider (Base Mainnet)
│   ├── Contract Detector (deployment monitoring)
│   ├── Source Fetcher (BaseScan API)
│   └── Certifier (onchain staking)
├── Analysis Layer (Claude Opus 4.5)
│   ├── Security Analyzer (9 vulnerability patterns)
│   └── Cross-Validation (score ↔ classification)
├── Social Layer
│   ├── Twitter Client (scam alerts)
│   └── Moltbook Skill (agent network)
├── Storage Layer
│   ├── SQLite (local state)
│   └── IPFS/Pinata (metadata)
└── Health Layer (Express.js)
    └── HTTP endpoints (/health, /stats)
```

## Smart Contract

**CertificationRegistry**: `0x961711BD6f9921A4ccfA778ac0d14d553dF30be8`

| Parameter | Value |
|-----------|-------|
| Network | Base Mainnet (Chain ID: 8453) |
| Min Stake | 0.000001 ETH |
| Challenge Bond | 0.005 ETH |
| Slashing | 50% on valid challenge |

## How It Works

### 1. Detection Phase
- Subscribes to Base Mainnet via WebSocket
- Samples every 10th block to respect RPC rate limits
- Detects contract deployments (receipt.contractAddress != null)
- Stores deployment in SQLite database

### 2. Analysis Phase
- Fetches verified source code from BaseScan
- Falls back to bytecode analysis if not verified
- Sends to Claude Opus 4.5 with security-focused prompt
- Detects 9 vulnerability patterns:

| Pattern | Description |
|---------|-------------|
| Honeypot | Can buy but not sell, hidden fees |
| Rug Pull | Owner can mint/drain liquidity |
| Reentrancy | External calls before state updates |
| Selfdestruct | Can destroy contract and steal ETH |
| Delegatecall | Can execute arbitrary code |
| Flash Loan | Price oracle manipulation risks |
| Suspicious Permissions | Owner can pause/modify balances |
| Token Clone | Impersonating known tokens |
| Proxy Upgradeable | Upgradeable logic risks |

### 3. Classification

| Safety Score | Classification | Action |
|--------------|----------------|--------|
| 80-100 | SAFE | Certify onchain + Tweet |
| 40-79 | SUSPICIOUS | Log only |
| 0-39 | SCAM | Tweet alert |

Cross-validation ensures classification matches score (auto-corrects inconsistencies).

### 4. Actions

**SCAM Detected**:
```
🚨 CRITICAL SCAM ALERT

Contract: 0xcB1F...d10
Risk: 95/100
Issue: Honeypot - users cannot sell

⛔ DO NOT INTERACT

https://basescan.org/address/...
```

**SAFE Contract**:
1. Upload metadata to IPFS
2. Call `CertificationRegistry.certify()` with stake
3. Post certification tweet

## Project Structure

```
BaseGuardian/
├── src/
│   └── index.ts              # Agent entry point
├── lib/
│   ├── blockchain/           # Provider, detector, certifier
│   ├── analysis/             # Claude AI analyzer
│   ├── social/               # Twitter client
│   ├── storage/              # SQLite + IPFS
│   ├── health/               # Health server
│   └── utils/                # Logger, config
├── skills/
│   └── moltbook-interact/    # Moltbook posting skill
├── data/
│   ├── baseguardian.db       # SQLite database
│   └── logs/                 # Daily logs
├── tests/                    # Integration tests
├── openclaw.json5            # OpenClaw configuration
└── .env                      # Configuration (not committed)
```

## Installation

### Prerequisites
- Node.js >= 20.0.0
- Base RPC endpoint (Alchemy recommended)
- API keys: Anthropic, Twitter, BaseScan, Pinata
- Agent wallet with >= 0.0001 ETH on Base Mainnet

### Setup

```bash
# Clone repository
git clone https://github.com/xam-dev-ux/BaseGuardian.git
cd BaseGuardian

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Build
npm run build

# Run
npm start
```

## Configuration

Key environment variables:

```bash
# Blockchain
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_WSS_URL=wss://base-mainnet.g.alchemy.com/v2/YOUR_KEY
BASESCAN_API_KEY=your_key

# AI
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-opus-4-5-20251101

# Twitter
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...

# Storage
PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# Agent (NEVER COMMIT)
AGENT_PRIVATE_KEY=0x...
AGENT_ADDRESS=0x...

# Thresholds
MIN_STAKE_ETH=0.000001
SCAM_THRESHOLD=70
```

## Health Endpoints

```bash
curl http://localhost:3000/        # Agent info
curl http://localhost:3000/health  # Health status
curl http://localhost:3000/stats   # Daily statistics
```

## Real Detection Examples

The agent has detected multiple scam contracts:

| Contract | Safety Score | Classification |
|----------|--------------|----------------|
| 0xcB1F08f68a... | 5 | SCAM (Critical) |
| 0x1cDF2C7Ac0... | 35 | SCAM |
| 0x01B427E869... | 5 | SCAM (Critical) |
| 0x87cA3146e5... | 35 | SCAM |

All detections triggered automatic Twitter alerts.

## Rate Limiting

| Service | Limit |
|---------|-------|
| Alchemy RPC | ~5 calls/sec (free tier) |
| Twitter | 12 posts/hour |
| Claude API | Based on plan |
| Block Sampling | Every 10th block |

RPC throttling implemented with 100-500ms delays between calls.

## Implementation Status

✅ **Complete & Operational**:
- [x] Real-time contract monitoring
- [x] Claude Opus 4.5 analysis
- [x] 9 vulnerability pattern detection
- [x] Safety score with cross-validation
- [x] Twitter scam alerts
- [x] Onchain certification with staking
- [x] IPFS metadata storage
- [x] Moltbook integration
- [x] Rate limit handling
- [x] Health monitoring

🎯 **Future Enhancements**:
- Farcaster alerts via Neynar API (cross-post scam warnings to Warpcast)
- BaseReview integration (send alerts to [BaseReview MiniApp](https://base.app/app/base-review.vercel.app) - community-powered reviews for Base MiniApps)
- USDC staking (Circle CCTP)
- Machine learning detection
- Multi-agent coordination (distribute block monitoring across agents to analyze 100% of contracts instead of sampling every 10th block)

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Insufficient balance" | Fund wallet with >= 0.0001 ETH |
| "429 rate limit" | Using Alchemy free tier, delays added |
| "WebSocket failed" | Check BASE_WSS_URL |
| "Twitter 403" | Verify OAuth credentials |
| "BaseScan NOTOK" | Normal for unverified contracts |

## Security

- Never commit `.env` file
- API keys in environment variables only
- Moltbook credentials in `~/.config/moltbook/`
- Stakes are real ETH at risk

## License

MIT License

## Acknowledgments

- Powered by [Claude Opus 4.5](https://anthropic.com) (Anthropic)
- Deployed on [Base Mainnet](https://base.org) (Coinbase L2)
- Social network: [Moltbook](https://moltbook.com)

---

**⚠️ Disclaimer**: This agent provides automated analysis but is not infallible. Always DYOR before interacting with any smart contract.

**🛡️ BaseGuardian - Keeping Base Safe, One Contract at a Time**
