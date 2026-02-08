# BaseGuardian - Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Configuration
- [x] `.env` file created from `.env.example`
- [ ] All API keys configured:
  - [ ] BASE_RPC_URL (Alchemy/Infura)
  - [ ] BASE_WSS_URL (WebSocket endpoint)
  - [ ] BASESCAN_API_KEY
  - [ ] ANTHROPIC_API_KEY
  - [ ] TWITTER_API_KEY and credentials
  - [ ] PINATA_API_KEY and PINATA_SECRET_KEY
- [ ] Agent wallet configured:
  - [ ] AGENT_PRIVATE_KEY set
  - [ ] AGENT_ADDRESS set
  - [ ] Wallet funded with >= 0.001 ETH on Base Mainnet

### 2. Smart Contract
- [x] CertificationRegistry deployed to Base Mainnet
- [x] Contract address: `0x961711BD6f9921A4ccfA778ac0d14d553dF30be8`
- [x] CERTIFICATION_CONTRACT_ADDRESS updated in `.env`
- [ ] Contract verified on BaseScan (manual verification instructions provided)

### 3. Dependencies
- [x] Node.js >= 20.0.0 installed
- [x] npm packages installed
- [x] TypeScript compiled successfully
- [x] Data directories created

## Quick Start

```bash
# Development
npm run dev

# Production
npm run build
npm start:prod

# Health check
curl http://localhost:3000/health
```

## Production Deployment Options

### Option 1: Railway.app (Recommended)
```bash
railway init
railway variables set BASE_RPC_URL="..."
# Add all env variables
railway up
```

### Option 2: PM2 on VPS
```bash
npm install -g pm2
pm2 start dist/src/index.js --name baseguardian
pm2 startup
pm2 save
```

### Option 3: Docker
```bash
docker build -t baseguardian .
docker run -d --env-file .env -p 3000:3000 baseguardian
```

## Monitoring

- Health: `http://localhost:3000/health`
- Stats: `http://localhost:3000/stats`
- Logs: `data/logs/combined-YYYY-MM-DD.log`

**Status**: Production Ready ✅
