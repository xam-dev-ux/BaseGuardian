# BaseGuardian - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites Checklist
- [ ] Node.js 20+ installed
- [ ] Git installed
- [ ] Base Mainnet RPC URL (from Alchemy/Infura)
- [ ] Anthropic API key
- [ ] Twitter API credentials
- [ ] Pinata API key
- [ ] Wallet with >= 0.001 ETH on Base Mainnet

### Step 1: Configure Environment

Edit `.env` file with your credentials:

```bash
# Blockchain (REQUIRED)
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_WSS_URL=wss://base-mainnet.g.alchemy.com/v2/YOUR_KEY
BASESCAN_API_KEY=your_basescan_key

# Agent Wallet (REQUIRED)
AGENT_PRIVATE_KEY=0x...    # Your wallet private key
AGENT_ADDRESS=0x...        # Your wallet address

# Smart Contract (ALREADY DEPLOYED)
CERTIFICATION_CONTRACT_ADDRESS=0x961711BD6f9921A4ccfA778ac0d14d553dF30be8

# AI (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-...

# Twitter (REQUIRED if ENABLE_TWITTER=true)
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...

# IPFS (REQUIRED)
PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# Features
ENABLE_CERTIFICATIONS=true
ENABLE_TWITTER=true
ENABLE_FARCASTER=false
```

### Step 2: Install & Build

```bash
npm install
npm run build
```

### Step 3: Run Agent

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

Or use the compiled version:
```bash
npm run start:prod
```

### Step 4: Verify It's Running

Open another terminal and check health:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "healthy": true,
  "timestamp": "2026-02-07T...",
  "blockchain": {
    "connected": true,
    "currentBlock": 12345678
  },
  "wallet": {
    "address": "0x...",
    "balanceEth": "0.005000",
    "sufficient": true
  }
}
```

### Step 5: Monitor Logs

Watch for contract detections:
```bash
tail -f data/logs/combined-$(date +%Y-%m-%d).log
```

You should see:
- "BaseGuardian - Starting autonomous security agent"
- "Blockchain connected"
- "WebSocket connected successfully"
- "Monitoring active"
- "BaseGuardian is now protecting Base Mainnet"

## 📊 What Happens Next?

1. **Detection**: Agent monitors Base Mainnet for new contract deployments
2. **Analysis**: Each deployment is analyzed by Claude AI for security threats
3. **Classification**: Contracts are scored (0-100) and classified as SAFE/SUSPICIOUS/SCAM
4. **Action**:
   - SCAM (score < 70): Posts Twitter alert
   - SAFE (score >= 80): Certifies onchain with staked ETH
   - SUSPICIOUS: Logs for monitoring

## 🔍 Check Agent Activity

### View Statistics
```bash
curl http://localhost:3000/stats
```

### Check Database
```bash
sqlite3 data/baseguardian.db "SELECT COUNT(*) FROM deployments;"
sqlite3 data/baseguardian.db "SELECT COUNT(*) FROM analyses;"
sqlite3 data/baseguardian.db "SELECT COUNT(*) FROM certifications;"
```

### View Recent Analyses
```bash
sqlite3 data/baseguardian.db "SELECT contract_address, classification, risk_score FROM analyses ORDER BY id DESC LIMIT 10;"
```

## ⚠️ Common Issues

### "Insufficient balance" Error
**Solution**: Send >= 0.001 ETH to your AGENT_ADDRESS on Base Mainnet

### "WebSocket connection failed"
**Solution**: Check BASE_WSS_URL is correct and your RPC provider supports WebSocket

### "Twitter authentication failed"
**Solution**: Verify all 4 Twitter credentials are correct (API key, secret, access token, access secret)

### "IPFS upload failed"
**Solution**: Check PINATA_API_KEY and PINATA_SECRET_KEY are valid

### Agent not detecting contracts
**Solution**:
- Ensure WebSocket is connected (check logs)
- Verify BASE_WSS_URL is correct
- Check your RPC provider hasn't rate-limited you

## 🛑 Stop Agent

Press `Ctrl+C` in the terminal where agent is running.

The agent will:
1. Stop monitoring
2. Close database connections
3. Shutdown health server
4. Exit gracefully

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `DEPLOYMENT.md` for production deployment options
- Review `IMPLEMENTATION_SUMMARY.md` for technical details
- Monitor Twitter account for posted alerts (if enabled)
- Check BaseScan for certification transactions

## 🆘 Need Help?

1. Check logs in `data/logs/error-YYYY-MM-DD.log`
2. Review environment variables in `.env`
3. Ensure wallet has sufficient balance
4. Verify all API keys are valid
5. Check GitHub Issues

## 🎯 Success Indicators

Your agent is working correctly if you see:
- ✅ "BaseGuardian is now protecting Base Mainnet"
- ✅ "WebSocket connected successfully"
- ✅ Health endpoint returns `"healthy": true`
- ✅ New contracts appear in database
- ✅ Analyses are being performed
- ✅ Twitter posts appear (if enabled)

**Happy protecting! 🛡️**
