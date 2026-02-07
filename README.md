# BaseGuardian 🛡️

**Autonomous AI Security Agent for Base Mainnet**

BaseGuardian is an AI-powered security agent that monitors Base Mainnet 24/7, analyzes smart contracts for scams, alerts the community via Twitter, and certifies safe contracts onchain with reputation staking.

## Features

- **Real-Time Monitoring**: Detects new contract deployments on Base Mainnet via WebSocket
- **AI-Powered Analysis**: Uses Claude Opus 4.5 to analyze contracts for security threats
- **Threat Detection**: Identifies honeypots, rug pulls, hidden mints, and suspicious permissions
- **Social Media Alerts**: Posts scam warnings on Twitter (rate-limited)
- **Onchain Certification**: Certifies safe contracts with staked ETH stored in smart contract
- **IPFS Metadata**: Stores detailed analysis reports on IPFS (Pinata)
- **SQLite Database**: Tracks all analyses, certifications, and reputation events
- **Health Monitoring**: HTTP endpoints for status checks and statistics

## Architecture

```
BaseGuardian
├── Blockchain Layer (ethers.js)
│   ├── WebSocket Provider (real-time events)
│   ├── Contract Detector (new deployments)
│   ├── Source Fetcher (BaseScan API)
│   └── Certifier (onchain transactions)
├── Analysis Layer (Claude AI)
│   └── Security Analyzer (threat detection)
├── Social Layer (Twitter API)
│   └── Rate-Limited Posting
├── Storage Layer
│   ├── SQLite (state/analytics)
│   └── IPFS/Pinata (metadata)
└── Health Layer (Express)
    └── HTTP endpoints (/health, /stats)
```

## Smart Contract

**CertificationRegistry**: `0xddB1f3e6BD5bDab2d095d4350194398F36733F6a`

- Network: Base Mainnet (Chain ID: 8453)
- Features: Certification with staking, challenges, slashing
- Min Stake: 0.001 ETH
- Challenge Bond: 0.005 ETH

```
BaseGuardian/
├── openclaw.json5          # OpenClaw agent configuration
├── src/                    # Main agent code
│   └── index.ts           # Agent entry point
├── lib/                    # Core libraries
│   ├── blockchain/         # Provider, detector, source fetcher, certifier
│   ├── analysis/           # Claude AI analyzer
│   ├── social/             # Twitter client
│   ├── storage/            # SQLite + IPFS (Pinata)
│   ├── health/             # Health check server
│   └── utils/              # Logger + config
├── contracts/              # Smart contracts
│   └── CertificationRegistry.sol
├── data/                   # Runtime data
│   ├── baseguardian.db     # SQLite database (auto-created)
│   └── logs/               # Daily logs
└── tests/                  # Unit + integration tests
```

## Installation

### Prerequisites
- Node.js >= 20.0.0
- Base RPC endpoint (Alchemy recommended)
- API keys (Anthropic, Twitter, BaseScan, Pinata)
- Agent wallet with >= 0.001 ETH on Base Mainnet

### Setup

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/baseguardian.git
cd BaseGuardian
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

3. **Fund Agent Wallet**
```bash
# Send >= 0.001 ETH to AGENT_ADDRESS on Base Mainnet for gas + stakes
```

4. **Build Project**
```bash
npm run build
```

5. **Run Agent**
```bash
npm start
```

## Usage

### Development Mode
```bash
npm run dev  # Runs with tsx watch (auto-reload)
```

### Production Mode
```bash
npm run build
npm start:prod  # Runs compiled JavaScript
```

### Health Monitoring
```bash
# Agent info
curl http://localhost:3000/

# Health status
curl http://localhost:3000/health

# Daily statistics
curl http://localhost:3000/stats
```

### View Logs
```bash
# All logs
tail -f data/logs/combined-$(date +%Y-%m-%d).log

# Errors only
tail -f data/logs/error-$(date +%Y-%m-%d).log
```

## Configuration

See `.env.example` for all available configuration options.

### Key Environment Variables

```bash
# Blockchain
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_WSS_URL=wss://base-mainnet.g.alchemy.com/v2/YOUR_KEY
BASESCAN_API_KEY=your_key
CERTIFICATION_CONTRACT_ADDRESS=0xddB1f3e6BD5bDab2d095d4350194398F36733F6a

# AI
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-opus-4-5-20251101

# Social (Twitter only)
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
ENABLE_TWITTER=true

# Storage
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
SQLITE_DB_PATH=./data/baseguardian.db

# Agent Wallet (NEVER COMMIT)
AGENT_PRIVATE_KEY=0x...
AGENT_ADDRESS=0x...

# Feature Flags
ENABLE_CERTIFICATIONS=true
ENABLE_AUTO_STAKE=true

# Thresholds
SCAM_THRESHOLD=70
MIN_STAKE_ETH=0.001
```

## Development

### Run Tests
```bash
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration
```

### Lint Code
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## How It Works

### 1. Detection Phase
- Agent subscribes to Base Mainnet WebSocket
- Detects new contract deployments (tx.to === null)
- Waits for 2 block confirmations
- Stores deployment in database

### 2. Analysis Phase
- Fetches verified source code from BaseScan
- If not verified, analyzes bytecode patterns
- Sends to Claude AI with comprehensive security prompt
- Detects vulnerabilities:
  - Honeypot patterns (buy-only, hidden fees)
  - Rug pull indicators (owner minting, drainable liquidity)
  - Reentrancy vulnerabilities
  - Dangerous opcodes (SELFDESTRUCT, DELEGATECALL)
  - Flash loan vulnerabilities
  - Suspicious permissions
- Receives structured response:
  - `safety_score` (0-100, where 100 = SAFEST)
  - `classification` (SAFE/SUSPICIOUS/SCAM)
  - `threats` (array of specific findings)
  - `confidence` (0-100)
  - `patterns` (detected vulnerability types)

### 3. Action Phase

**If SCAM (safety_score < 40)**:
- Posts public alert on Twitter
- Includes contract address, risk level, threats
- Warns users "DO NOT INTERACT"

**If SAFE (safety_score >= 80, confidence >= 75)**:
- Creates certification metadata JSON
- Uploads to IPFS via Pinata
- Calls CertificationRegistry.certify() with stake
- Posts certification announcement on Twitter

**If SUSPICIOUS (safety_score 40-79)**:
- Logs for monitoring
- No public action taken

### 4. Reputation System
- Certifications are onchain with staked ETH
- Anyone can challenge a certification (0.005 ETH bond)
- Challenges trigger automatic re-analysis
- If challenge valid: guardian slashed 50%, challenger rewarded
- If challenge invalid: challenger loses bond

## Testing

```bash
npm test                  # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
```

## Security Considerations

1. **Private Keys**: Never commit `.env` file. Keep private keys secure.
2. **Wallet Balance**: Maintain >= 0.001 ETH for gas fees
3. **Rate Limits**: Twitter limited to 12 posts/hour
4. **API Keys**: Rotate regularly, use environment variables
5. **Stakes at Risk**: Your certifications are backed by real ETH

## Twitter Bot Guidelines

The agent follows Twitter automation policies:
- Max 12 posts per hour
- Minimum 10 seconds between posts
- No spam or duplicate content
- Clear disclosure of bot nature
- Valuable security information only

## Implementation Status

✅ **Complete & Tested**:
- [x] Project structure and configuration
- [x] Smart contract deployed on Base Mainnet
- [x] Database schema and SQLite setup
- [x] Blockchain monitoring (WebSocket)
- [x] Contract deployment detection
- [x] Source code fetching (BaseScan API)
- [x] Claude AI integration for analysis
- [x] Enhanced classification system (safety_score with cross-validation)
- [x] Twitter posting with rate limiting
- [x] Onchain certification with staking
- [x] IPFS metadata storage (Pinata)
- [x] Health check HTTP endpoints
- [x] Logging and error handling
- [x] End-to-end flow testing
- [x] Real-time scam detection on Base Mainnet

🎯 **Future Enhancements**:
- Machine learning scam detection
- Multi-chain support (Optimism, Arbitrum)
- Community voting on challenges
- Browser extension for warnings
- Mobile app notifications

## Troubleshooting

### "Insufficient balance" error
- Top up agent wallet to >= 0.001 ETH on Base Mainnet

### "WebSocket connection failed"
- Check BASE_WSS_URL is correct
- Verify RPC provider has WebSocket enabled
- Check firewall/network restrictions

### "Twitter rate limit exceeded"
- Wait for rate limit reset (shown in logs)
- Reduce TWITTER_MAX_POSTS_PER_HOUR in .env

### "IPFS upload failed"
- Verify Pinata API keys are correct
- Check Pinata account has sufficient storage

### "Claude API error"
- Verify ANTHROPIC_API_KEY is valid
- Check API usage limits/credits

## Contributing

This is a competition entry project. After competition:
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - See LICENSE file

## Acknowledgments

- Built for OpenClaw Framework competition
- Uses Claude Opus 4.5 by Anthropic
- Deployed on Base Mainnet (Coinbase L2)
- IPFS storage via Pinata

## Contact

- GitHub Issues: Report bugs and feature requests
- Twitter: TBD (agent account)

---

**⚠️ Disclaimer**: This agent provides automated analysis but is not infallible. Always do your own research (DYOR) before interacting with any smart contract. The agent's certifications are opinions backed by staked ETH, not guarantees.

**🛡️ BaseGuardian - Keeping Base Safe, One Contract at a Time**
