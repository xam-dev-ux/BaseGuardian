/**
 * Verify contract on BaseScan using API directly
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Contract details
const CONTRACT_ADDRESS = '0xddB1f3e6BD5bDab2d095d4350194398F36733F6a';
const COMPILER_VERSION = 'v0.8.20+commit.a1b79de6';
const OPTIMIZATION_USED = '1';
const RUNS = '200';
const LICENSE_TYPE = '3'; // MIT

// Read contract source code
const sourceCode = fs.readFileSync(
  path.join(__dirname, '../contracts/CertificationRegistry.sol'),
  'utf8'
);

// BaseScan API v2
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;
const API_URL = 'https://api.basescan.org/v2/api';

async function verifyContract() {
  console.log('🔍 Starting contract verification on BaseScan...\n');
  console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
  console.log(`🔧 Compiler: ${COMPILER_VERSION}`);
  console.log(`⚙️  Optimization: Yes (${RUNS} runs)\n`);

  try {
    // Prepare verification request
    const formData = new URLSearchParams({
      apikey: BASESCAN_API_KEY,
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: CONTRACT_ADDRESS,
      sourceCode: sourceCode,
      codeformat: 'solidity-single-file',
      contractname: 'CertificationRegistry',
      compilerversion: COMPILER_VERSION,
      optimizationUsed: OPTIMIZATION_USED,
      runs: RUNS,
      licenseType: LICENSE_TYPE,
      evmversion: 'paris',
    });

    console.log('📤 Submitting source code to BaseScan...');

    // Submit verification
    const response = await axios.post(API_URL, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const result = response.data;

    if (result.status === '1') {
      const guid = result.result;
      console.log(`✅ Verification submitted successfully!`);
      console.log(`📋 GUID: ${guid}\n`);

      // Wait and check verification status
      console.log('⏳ Waiting for verification (this may take 30-60 seconds)...\n');
      await checkVerificationStatus(guid);
    } else {
      console.error('❌ Verification submission failed:');
      console.error(result.result);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during verification:');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

async function checkVerificationStatus(guid) {
  const maxAttempts = 20;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const response = await axios.get(API_URL, {
        params: {
          apikey: BASESCAN_API_KEY,
          module: 'contract',
          action: 'checkverifystatus',
          guid: guid,
        },
      });

      const result = response.data;

      if (result.status === '1') {
        console.log('\n✅ Contract verified successfully!');
        console.log(`🌐 View on BaseScan:`);
        console.log(`https://basescan.org/address/${CONTRACT_ADDRESS}#code\n`);
        return;
      } else if (result.result === 'Pending in queue') {
        process.stdout.write('.');
        await sleep(3000); // Wait 3 seconds
      } else {
        console.error('\n❌ Verification failed:');
        console.error(result.result);
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ Error checking verification status:');
      console.error(error.message);
      process.exit(1);
    }
  }

  console.error('\n❌ Verification timeout. Please check manually at:');
  console.error(`https://basescan.org/address/${CONTRACT_ADDRESS}#code`);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run verification
verifyContract();
