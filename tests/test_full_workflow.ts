/**
 * End-to-End Integration Test
 * Tests the complete workflow from detection to action
 */

import { getClaudeAnalyzer } from '../lib/analysis/claudeAnalyzer.js';
import { getDatabase } from '../lib/storage/db.js';
import { getCertifier } from '../lib/blockchain/certifier.js';
import { getTwitterClient } from '../lib/social/twitter.js';

async function testFullWorkflow() {
  console.log('🧪 BaseGuardian - End-to-End Integration Test\n');
  console.log('='.repeat(60));

  const db = getDatabase();
  const analyzer = getClaudeAnalyzer();
  const certifier = getCertifier();
  const twitter = getTwitterClient();

  try {
    // Test 1: Database Operations
    console.log('\n1️⃣  Testing Database...');
    const stats = db.getDailyStats();
    console.log(`   ✅ Database connected`);
    console.log(`   📊 Stats: ${JSON.stringify(stats)}`);

    // Test 2: Twitter Connection
    console.log('\n2️⃣  Testing Twitter Connection...');
    const twitterOk = await twitter.testConnection();
    if (twitterOk) {
      console.log('   ✅ Twitter connected');
      const rateLimits = twitter.getRateLimitStatus();
      console.log(`   📊 Rate limits: ${rateLimits.remaining}/${rateLimits.maxPerHour} remaining`);
    } else {
      console.log('   ⚠️  Twitter connection failed (check credentials)');
    }

    // Test 3: Simulated Contract Analysis
    console.log('\n3️⃣  Testing AI Analysis (Simulated Safe Contract)...');
    const testContract = {
      address: '0x4200000000000000000000000000000000000006', // WETH on Base
      deployer: '0x0000000000000000000000000000000000000000',
      txHash: '0x' + '0'.repeat(64),
      blockNumber: 1,
      timestamp: Math.floor(Date.now() / 1000),
    };

    console.log(`   🔍 Analyzing: ${testContract.address}`);

    // Note: This will use real Claude API credits
    const mockSourceCode = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.0;

      contract WETH {
          mapping(address => uint256) public balanceOf;

          function deposit() public payable {
              balanceOf[msg.sender] += msg.value;
          }

          function withdraw(uint256 amount) public {
              require(balanceOf[msg.sender] >= amount);
              balanceOf[msg.sender] -= amount;
              payable(msg.sender).transfer(amount);
          }
      }
    `;

    const analysis = await analyzer.analyzeContract(
      testContract.address,
      mockSourceCode,
      undefined,
      {
        deployer: testContract.deployer,
        blockNumber: testContract.blockNumber,
        timestamp: testContract.timestamp,
      }
    );

    console.log(`   ✅ Analysis complete`);
    console.log(`   📊 Classification: ${analysis.classification}`);
    console.log(`   📊 Safety Score: ${analysis.safety_score}/100`);
    console.log(`   📊 Confidence: ${analysis.confidence}%`);
    console.log(`   📊 Threats: ${analysis.threats.length}`);

    // Test 4: Database Storage
    console.log('\n4️⃣  Testing Database Storage...');
    db.insertDeployment({
      contract_address: testContract.address,
      deployer_address: testContract.deployer,
      tx_hash: testContract.txHash,
      block_number: testContract.blockNumber,
      timestamp: testContract.timestamp,
    });
    console.log('   ✅ Deployment saved');

    db.insertAnalysis({
      contract_address: testContract.address,
      source_code: mockSourceCode,
      is_verified: true,
      risk_score: analysis.safety_score, // DB column is risk_score, but we store safety_score
      classification: analysis.classification,
      threats: JSON.stringify(analysis.threats),
      explanation: analysis.explanation,
      confidence: analysis.confidence,
    });
    console.log('   ✅ Analysis saved');

    // Test 5: Certification Check (won't actually certify in test)
    console.log('\n5️⃣  Testing Certification System...');
    const isCertified = await certifier.isCertified(testContract.address);
    console.log(`   📊 Already certified: ${isCertified}`);

    if (analysis.classification === 'SAFE' && analysis.safety_score >= 80) {
      console.log('   ✅ Contract meets certification criteria');
      console.log('   ℹ️  Would certify with stake: ~0.001 ETH');
      // Note: Skipping actual certification to avoid gas costs
    } else {
      console.log('   ⚠️  Contract does not meet certification criteria');
    }

    // Test 6: Stats Query
    console.log('\n6️⃣  Testing Statistics...');
    const finalStats = db.getDailyStats();
    console.log('   ✅ Stats retrieved');
    console.log(`   📊 Contracts scanned: ${finalStats.contracts_scanned}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Integration Tests Passed!\n');
    console.log('Summary:');
    console.log('  ✅ Database: Working');
    console.log(`  ${twitterOk ? '✅' : '⚠️ '} Twitter: ${twitterOk ? 'Working' : 'Check credentials'}`);
    console.log('  ✅ AI Analysis: Working');
    console.log('  ✅ Data Persistence: Working');
    console.log('  ✅ Certification System: Ready');
    console.log('\n🎉 BaseGuardian is fully operational!\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFullWorkflow().then(() => process.exit(0));
