/**
 * Real-time Statistics Display
 * Shows live agent statistics
 */

import { getDatabase } from '../lib/storage/db.js';
import { getProvider } from '../lib/blockchain/provider.js';
import { appConfig } from '../lib/utils/config.js';

async function showStats() {
  const db = getDatabase();
  const provider = getProvider();

  console.clear();
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       🛡️  BaseGuardian - Live Statistics Dashboard       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log();

  // Blockchain Info
  try {
    const blockNumber = await provider.getBlockNumber();
    const balance = await provider.getBalance(appConfig.AGENT_ADDRESS);
    const balanceEth = Number(balance) / 1e18;

    console.log('⛓️  BLOCKCHAIN STATUS');
    console.log('─'.repeat(60));
    console.log(`  Network: Base Mainnet (Chain ID: 8453)`);
    console.log(`  Current Block: ${blockNumber.toLocaleString()}`);
    console.log(`  Agent Wallet: ${appConfig.AGENT_ADDRESS}`);
    console.log(`  Balance: ${balanceEth.toFixed(6)} ETH`);
    console.log();
  } catch (error: any) {
    console.log('⛓️  BLOCKCHAIN STATUS: ❌ Disconnected');
    console.log();
  }

  // Daily Stats
  const stats = db.getDailyStats();
  console.log('📊 TODAY\'S STATISTICS');
  console.log('─'.repeat(60));
  console.log(`  Contracts Scanned: ${stats.contracts_scanned || 0}`);
  console.log(`  Scams Detected: ${stats.scams_detected || 0}`);
  console.log(`  Safe Certified: ${stats.safe_certified || 0}`);
  console.log(`  Warnings Issued: ${stats.warnings_issued || 0}`);
  console.log();

  // Certifications
  const certifications = db.getAllCertifications();
  console.log('🛡️  CERTIFICATIONS');
  console.log('─'.repeat(60));
  console.log(`  Total Certified: ${certifications.length}`);

  if (certifications.length > 0) {
    console.log('\n  Recent certifications:');
    certifications.slice(0, 5).forEach((cert, i) => {
      const addr = cert.contract_address;
      const short = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
      console.log(`    ${i + 1}. ${short} (${cert.stake_amount} wei)`);
    });
  } else {
    console.log('  No certifications issued yet');
  }
  console.log();

  // Reputation
  const reputation = db.getReputationMetrics();
  console.log('⭐ REPUTATION');
  console.log('─'.repeat(60));
  console.log(`  Total Certifications: ${reputation.total_certifications || 0}`);
  console.log(`  Challenges: ${reputation.total_challenges || 0}`);
  console.log(`  Slashes: ${reputation.total_slashes || 0}`);
  console.log(`  Rewards Earned: ${reputation.total_rewards || 0}`);

  const accuracy = reputation.total_challenges > 0
    ? ((reputation.total_challenges - reputation.total_slashes) / reputation.total_challenges * 100).toFixed(2)
    : 'N/A';
  console.log(`  Accuracy Rate: ${accuracy}${accuracy !== 'N/A' ? '%' : ''}`);
  console.log();

  // Contract Info
  console.log('📜 SMART CONTRACT');
  console.log('─'.repeat(60));
  console.log(`  Address: ${appConfig.CERTIFICATION_CONTRACT_ADDRESS}`);
  console.log(`  Network: Base Mainnet`);
  console.log(`  BaseScan: https://basescan.org/address/${appConfig.CERTIFICATION_CONTRACT_ADDRESS}`);
  console.log();

  // Health Status
  try {
    const healthResponse = await fetch('http://localhost:3000/health');
    if (healthResponse.ok) {
      const health = await healthResponse.json() as { uptime: number; healthy: boolean; timestamp: number };
      const uptimeMinutes = Math.floor(health.uptime / 60);
      const uptimeHours = Math.floor(uptimeMinutes / 60);
      const uptimeRemainder = uptimeMinutes % 60;

      console.log('💚 AGENT HEALTH');
      console.log('─'.repeat(60));
      console.log(`  Status: ${health.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
      console.log(`  Uptime: ${uptimeHours}h ${uptimeRemainder}m`);
      console.log(`  Last Check: ${new Date(health.timestamp).toLocaleTimeString()}`);
      console.log(`  Health Endpoint: http://localhost:${appConfig.HEALTH_CHECK_PORT}/health`);
    }
  } catch (error) {
    console.log('💚 AGENT HEALTH: ⚠️  Health server not responding');
  }

  console.log();
  console.log('═'.repeat(60));
  console.log('Last updated:', new Date().toLocaleString());
  console.log('Run `npm run stats` to refresh');
  console.log();
}

showStats()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
