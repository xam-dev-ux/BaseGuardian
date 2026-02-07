/**
 * Test WebSocket connection and block events
 */

import { WebSocketProvider } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function testWebSocket() {
  console.log('🔍 Testing WebSocket connection...\n');

  const WSS_URL = process.env.BASE_WSS_URL!;
  console.log(`Connecting to: ${WSS_URL}\n`);

  try {
    const wsProvider = new WebSocketProvider(WSS_URL);
    await wsProvider.ready;
    console.log('✅ WebSocket connected\n');

    let blockCount = 0;
    let startTime = Date.now();

    wsProvider.on('block', (blockNumber: number) => {
      blockCount++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`📦 Block #${blockNumber} detected (${blockCount} blocks in ${elapsed}s)`);

      if (blockCount >= 5) {
        console.log('\n✅ WebSocket is working correctly!');
        console.log(`   Received ${blockCount} block notifications`);
        process.exit(0);
      }
    });

    wsProvider.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    console.log('Listening for blocks... (waiting for 5 blocks)\n');

    // Timeout after 2 minutes
    setTimeout(() => {
      console.log(`\n⏱️ Timeout: Only received ${blockCount} blocks in 2 minutes`);

      if (blockCount === 0) {
        console.log('❌ WebSocket is NOT receiving block events!');
        console.log('   This is the problem - the monitoring won\'t work.');
      }

      process.exit(1);
    }, 120000);

  } catch (error: any) {
    console.error('❌ Failed to connect:', error.message);
    process.exit(1);
  }
}

testWebSocket();
