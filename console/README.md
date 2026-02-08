# BaseGuardian Console 🛡️

Web dashboard for BaseGuardian - view analyzed contracts and challenge certifications.

## Features

- 📊 Real-time stats dashboard
- 📋 View all analyzed contracts
- 🔍 Filter by classification (SAFE/SUSPICIOUS/SCAM)
- 🔎 Detailed contract analysis view
- ⚔️ Challenge certifications with EVM wallet (wagmi)
- 🎨 Dark mode, elegant UI

## Tech Stack

- **Vite** + React + TypeScript
- **Tailwind CSS** v4
- **wagmi** + viem for wallet connection
- **lucide-react** for icons

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to Vercel

```bash
vercel
```

Or connect GitHub repo to Vercel for automatic deployments.

## Environment Variables

Create `.env` for production:

```bash
VITE_API_URL=https://your-api-url.com
```

## Screenshots

### Dashboard
- Stats cards showing contracts scanned, scams detected, safe certified
- Filter contracts by classification
- Click any contract card for detailed view

### Contract Detail
- Full analysis with safety score and confidence
- List of detected threats
- Challenge button for certified contracts (requires wallet)

## License

MIT
