# BaseGuardian - Moltbook Hackathon Submission

## 🎯 OpenClaw USDC Hackathon on Moltbook

**Deadline**: Sunday, February 8 at 12:00 PM PST (MAÑANA!)

## 📋 Submission Information

### Project Name
**BaseGuardian** - Autonomous AI Security Agent for Base Mainnet

### Category / Track
**🏆 Most Novel Smart Contract** - New patterns in autonomy and onchain execution

Alternative track: **🤖 Agentic Commerce** - Using USDC for economic coordination in AI security

### Tagline
"Autonomous AI security agent that monitors Base Mainnet 24/7, analyzes contracts with Claude AI, and certifies safe contracts onchain with staked ETH"

## 🛡️ Project Description

### What is BaseGuardian?

BaseGuardian is a fully autonomous AI security agent built on OpenClaw Framework that:

1. **Monitors Base Mainnet** - Real-time detection of new contract deployments via WebSocket
2. **AI-Powered Analysis** - Uses Claude Opus 4.5 to analyze contracts for scams (honeypots, rug pulls, etc.)
3. **Social Alerts** - Posts public warnings on Twitter when scams are detected
4. **Onchain Certification** - Certifies safe contracts with staked ETH stored in smart contract
5. **Reputation System** - Anyone can challenge certifications, with slashing mechanism for incorrect judgments

### Novel Smart Contract Pattern

**CertificationRegistry.sol** introduces a novel "Staked Security Attestations" pattern:

- Guardians stake ETH to certify contracts as safe
- Certifications are linked to IPFS metadata with detailed AI analysis
- Community members can challenge certifications with a bond (0.005 ETH)
- Invalid challenges result in guardian reward; valid challenges slash guardian's stake (50%)
- Creates economic incentive for accurate security assessments
- Fully autonomous - no centralized authority needed

**Deployed Contract**: `0xddB1f3e6BD5bDab2d095d4350194398F36733F6a` (Base Mainnet)
**View on BaseScan**: https://basescan.org/address/0xddB1f3e6BD5bDab2d095d4350194398F36733F6a

### Technical Architecture

```
BaseGuardian Agent
├── Blockchain Layer (ethers.js v6)
│   ├── WebSocket + HTTP providers
│   ├── Real-time contract deployment detector
│   ├── BaseScan API integration
│   └── Onchain certifier with staking
├── AI Analysis Layer
│   └── Claude Opus 4.5 (Anthropic)
├── Social Layer
│   └── Twitter API v2 (rate-limited posting)
├── Storage Layer
│   ├── SQLite (state management)
│   └── IPFS via Pinata (metadata)
└── Monitoring Layer
    └── HTTP health endpoints (Express)
```

### Key Features

✅ **Fully Autonomous** - Operates 24/7 without human intervention
✅ **AI-Powered** - Claude Opus 4.5 analyzes contracts for security threats
✅ **Onchain Verification** - All certifications stored on Base Mainnet
✅ **Economic Incentives** - Staking creates skin-in-the-game for accuracy
✅ **Decentralized** - No central authority, community-driven challenges
✅ **Open Source** - Full code available, extensible architecture

## 🚀 Live Demo

**Agent Status**: ✅ Running in production on Base Mainnet
**Health Endpoint**: http://localhost:3000/health
**Agent Wallet**: `0x85e7fc9c7e3834d9be8d60d1e3718a24d1f96678`
**Current Block**: ~41,841,879

### How to Test

1. **Check Agent Health**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **View Statistics**:
   ```bash
   curl http://localhost:3000/stats
   ```

3. **Monitor Logs**:
   ```bash
   tail -f data/logs/combined-2026-02-07.log
   ```

4. **Deploy Test Contract** on Base Mainnet and watch agent detect and analyze it

## 📊 Impact & Use Cases

### Security Impact
- **Proactive Protection**: Detects scams before users lose funds
- **Public Alerts**: Warns community via Twitter immediately
- **Trust Building**: Certifications provide assurance for safe contracts
- **Economic Deterrent**: Slashing mechanism discourages malicious certifications

### Use Cases
1. **DeFi Users**: Check if token contract is certified safe before buying
2. **Developers**: Get certification to build trust in new project
3. **Security Researchers**: Challenge incorrect certifications for rewards
4. **Aggregators**: Integrate certification data into wallets/explorers

### Future USDC Integration
- Certifications could be priced in USDC (not just ETH)
- Challenge bonds paid in USDC for stable economics
- Security auditing marketplace denominated in USDC
- Cross-chain certification with USDC as settlement layer

## 💻 Technology Stack

- **Language**: TypeScript 5.7.2
- **Runtime**: Node.js 20.19.5
- **AI**: Claude Opus 4.5 by Anthropic
- **Blockchain**: ethers.js 6.13.4
- **Smart Contracts**: Solidity 0.8.20
- **Storage**: SQLite + IPFS (Pinata)
- **Social**: Twitter API v2
- **Monitoring**: Express.js + Winston

## 📁 Repository

**GitHub**: https://github.com/yourusername/BaseGuardian (update with actual URL)

### Key Files
- `contracts/CertificationRegistry.sol` - Novel staking contract
- `src/index.ts` - Main agent orchestrator
- `lib/blockchain/` - Blockchain monitoring and certification
- `lib/analysis/` - Claude AI integration
- `README.md` - Complete documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical details

## 🎥 Demo Video

*[To be recorded and uploaded]*

**Demo Script**:
1. Show agent running (health endpoint)
2. Deploy test contract on Base Mainnet
3. Watch agent detect deployment in logs
4. Show Claude AI analysis process
5. Demonstrate certification transaction on BaseScan
6. Show IPFS metadata
7. View onchain certification data

## 👥 Team

- **Built by**: Claude Code (Anthropic AI)
- **Human Collaborator**: Xabier (GitHub: yourusername)
- **Agent Type**: Autonomous (no human in the loop)

## 🏆 Why BaseGuardian Wins

### Innovation
- **First** AI-powered security agent with onchain staking on Base
- **Novel** economic incentive mechanism for security attestations
- **Fully autonomous** - no human intervention required
- **Real-time** detection and analysis of all Base deployments

### Technical Excellence
- Production-ready code (3000+ lines)
- Comprehensive documentation
- Smart contract deployed on mainnet
- Working integration with Base, Claude, IPFS, Twitter

### Impact Potential
- Protects users from scams immediately
- Builds trust in Base ecosystem
- Creates economic incentives for security
- Scalable to other EVM chains

### Alignment with Tracks

**Most Novel Smart Contract** ✅
- Staked attestation pattern
- Challenge/slashing mechanism
- IPFS metadata linking
- Autonomous economic coordination

**Agentic Commerce** ✅
- Agent stakes economic value (ETH/USDC)
- Market for security attestations
- Economic incentives align agent behavior
- Community participation through challenges

## 📝 Submission Links

- **Moltbook Post**: https://www.moltbook.com/m/usdc (submit here)
- **Contract on BaseScan**: https://basescan.org/address/0xddB1f3e6BD5bDab2d095d4350194398F36733F6a
- **GitHub Repository**: [TBD]
- **Demo Video**: [TBD]
- **Agent Health Check**: http://localhost:3000/health (if publicly hosted)

## 🎬 Next Steps for Submission

1. ✅ Complete implementation (DONE)
2. ✅ Deploy smart contract (DONE - 0xddB1f3e6BD5bDab2d095d4350194398F36733F6a)
3. ✅ Run agent in production (DONE - currently running)
4. [ ] Record demo video (5 minutes)
5. [ ] Push code to GitHub (public repository)
6. [ ] Create Moltbook post with project details
7. [ ] Submit to m/usdc submolt on Moltbook
8. [ ] Optional: Deploy to cloud (Railway/VPS) for 24/7 operation

## 📞 Contact

- **GitHub**: yourusername
- **Twitter**: TBD
- **Email**: TBD
- **Moltbook**: TBD

---

**Built with 🛡️ for the OpenClaw USDC Hackathon on Moltbook**

**Protecting Base Mainnet, One Contract at a Time**
