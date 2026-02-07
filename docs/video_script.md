# BaseGuardian Video Demo Script

**Duration**: 5-7 minutes
**Tools needed**: Screen recording (Loom, OBS), Terminal, Browser

---

## INTRO (30 seconds)

**[Screen: BaseGuardian logo or README header]**

> "Hey everyone! I'm going to show you BaseGuardian - an autonomous AI security agent that protects the Base ecosystem from scam contracts.
>
> What makes it special? It runs 24/7 with ZERO human intervention. It monitors Base Mainnet, analyzes every new contract with Claude AI, and takes action automatically - posting scam alerts on Twitter and certifying safe contracts onchain with real ETH at stake."

---

## SECTION 1: The Problem (45 seconds)

**[Screen: Show some scam contract examples on BaseScan]**

> "Every day, hundreds of contracts are deployed on Base. Many are legitimate, but some are scams - honeypots where you can buy but never sell, rug pulls where owners can drain all funds.
>
> The problem? By the time humans detect these scams, people have already lost money. We need something faster - an autonomous agent that reacts in real-time."

---

## SECTION 2: Architecture Overview (1 minute)

**[Screen: Show README architecture diagram or draw it]**

> "BaseGuardian has four main layers:
>
> **1. Blockchain Layer** - WebSocket connection to Base Mainnet, monitoring every block for new contract deployments
>
> **2. Analysis Layer** - Claude Opus 4.5 analyzes each contract for 9 vulnerability patterns: honeypots, rug pulls, reentrancy, selfdestruct, and more
>
> **3. Social Layer** - Automatic Twitter alerts for scams, certification announcements for safe contracts
>
> **4. Onchain Layer** - The killer feature. When we certify a contract as safe, we stake real ETH. If we're wrong, anyone can challenge us and we lose half our stake. Skin in the game."

---

## SECTION 3: Live Demo - Starting the Agent (1.5 minutes)

**[Screen: Terminal]**

```bash
# Show the project structure
ls -la

# Show the config (blur sensitive keys!)
cat .env | head -20

# Start the agent
npm start
```

> "Let's start the agent. You can see it:
> - Validates configuration
> - Connects to Base Mainnet via WebSocket
> - Checks wallet balance
> - Tests Twitter connection
> - Starts monitoring for new contracts"

**[Wait for a contract detection or show logs]**

> "When it detects a new contract, it automatically:
> 1. Fetches the source code from BaseScan
> 2. Sends it to Claude for analysis
> 3. Gets a safety score from 0-100
> 4. Takes action based on the classification"

---

## SECTION 4: Show a Real Detection (1 minute)

**[Screen: Show logs or database with detected contracts]**

```bash
# Query the database for recent detections
sqlite3 data/baseguardian.db "SELECT address, safety_score, classification FROM analyses ORDER BY created_at DESC LIMIT 5"
```

> "Here are real contracts we've analyzed. You can see some with safety scores of 5 or 35 - these are SCAMS. The agent automatically posted alerts about these to Twitter."

**[Screen: Show @LeoLeoArg1 Twitter profile with scam alerts]**

> "Here's our Twitter profile. These alerts went out automatically, within minutes of the contracts being deployed. No human involved."

---

## SECTION 5: Onchain Certification (1 minute)

**[Screen: BaseScan showing the CertificationRegistry contract]**

> "The most innovative part - onchain certification. When we find a safe contract with high confidence, we don't just tweet about it. We call our CertificationRegistry smart contract and stake real ETH.
>
> This is at address 0xddB1...6a on Base Mainnet. Anyone can verify our certifications onchain."

**[Show a certification transaction on BaseScan]**

> "Each certification includes:
> - The contract address
> - IPFS hash with full analysis
> - Stake amount based on confidence
>
> If someone thinks we made a mistake, they can challenge by bonding 0.005 ETH. If the challenge is valid, we lose 50% of our stake. Real consequences, real accountability."

---

## SECTION 6: Code Walkthrough (1 minute)

**[Screen: VS Code showing key files]**

> "Quick look at the code. The main agent orchestrates everything from `src/index.ts`.
>
> The detector in `lib/blockchain/detector.ts` uses WebSocket to monitor blocks.
>
> Claude analysis happens in `lib/analysis/claudeAnalyzer.ts` - we send the contract code and get back a structured JSON with safety score, classification, and detected vulnerabilities.
>
> The certifier in `lib/blockchain/certifier.ts` handles the onchain transactions."

---

## SECTION 7: Why It Matters (30 seconds)

**[Screen: Back to you or summary slide]**

> "BaseGuardian represents a new paradigm - autonomous agents with real skin in the game. We're not just alerting, we're putting ETH behind our analysis.
>
> This creates accountability. Wrong certifications cost us money. It aligns incentives and builds trust.
>
> The agent runs 24/7, never sleeps, never takes breaks. It's protecting Base users around the clock."

---

## OUTRO (30 seconds)

**[Screen: Links and social handles]**

> "You can find BaseGuardian at:
> - Twitter: @LeoLeoArg1
> - Moltbook: moltbook.com/u/BaseGuardian
> - Smart Contract on BaseScan
> - Code on GitHub
>
> Built for the OpenClaw hackathon. Thanks for watching, and stay safe on Base!"

---

## Recording Tips

1. **Blur sensitive data**: API keys, private keys in .env
2. **Have contracts ready**: Pre-detect some contracts so you have data to show
3. **Clean terminal**: Use a simple prompt, increase font size
4. **Speak clearly**: Moderate pace, enthusiasm but not over the top
5. **Show real data**: Real scam detections, real transactions
6. **Keep it focused**: Don't go into every detail, highlight key innovations

## B-Roll Suggestions

- BaseScan transactions
- Twitter feed with alerts
- Terminal logs scrolling
- Architecture diagram
- Code editor with syntax highlighting
