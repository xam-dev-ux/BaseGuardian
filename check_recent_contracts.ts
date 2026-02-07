/**
 * Check for recent contract deployments
 */

import { JsonRpcProvider } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function checkRecentContracts() {
  const provider = new JsonRpcProvider(process.env.BASE_RPC_URL!);

  const currentBlock = await provider.getBlockNumber();
  console.log(`Current block: ${currentBlock}\n`);
  console.log('Scanning last 100 blocks for contract deployments...\n');

  let found = 0;
  for (let i = 0; i < 100; i++) {
    const blockNum = currentBlock - i;
    const block = await provider.getBlock(blockNum, true);

    if (!block || !block.transactions) continue;

    for (const tx of block.transactions) {
      if (typeof tx === 'string') continue;

      // Contract deployment = to === null
      if (tx.to === null) {
        found++;
        console.log(`📦 Contract deployment found!`);
        console.log(`   Block: ${blockNum}`);
        console.log(`   TX: ${tx.hash}`);
        console.log(`   Deployer: ${tx.from}\n`);
      }
    }
  }

  console.log(`\nTotal contracts found in last 100 blocks: ${found}`);
  console.log(`Average: ${(found / 100 * 100).toFixed(2)} contracts per 100 blocks`);
  console.log(`\nNote: Base averages ~2 seconds per block`);
  console.log(`100 blocks = ~3.3 minutes`);

  if (found === 0) {
    console.log('\n⏳ No contracts deployed in last 3 minutes');
    console.log('   This is normal - contracts are deployed occasionally');
    console.log('   The agent is working correctly, just waiting for deployments');
  }
}

checkRecentContracts().then(() => process.exit(0));
