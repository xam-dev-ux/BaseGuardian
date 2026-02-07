/**
 * Smart Contract Deployment Script for BaseGuardian
 * Deploys CertificationRegistry to Base Mainnet
 */

import { ethers } from 'ethers';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Solidity compiler (you'll need to compile the contract first or use Hardhat/Foundry)
// For this script, we assume the contract is already compiled

const CONTRACT_ABI = [
  "constructor()",
  "function certify(address _contractAddress, string memory _ipfsHash, uint256 _riskScore) external payable",
  "function challenge(address _contractAddress, string memory _reason) external payable",
  "function resolveChallenge(address _contractAddress, uint256 _challengeIndex, bool _valid) external",
  "function getCertification(address _contractAddress) external view returns (tuple(address contractAddress, address guardian, string ipfsHash, uint256 riskScore, uint256 stakeAmount, uint256 timestamp, bool active, uint256 challengeCount))",
  "function isCertified(address _contractAddress) external view returns (bool)",
  "event ContractCertified(address indexed contractAddress, address indexed guardian, string ipfsHash, uint256 riskScore, uint256 stakeAmount, uint256 timestamp)"
];

interface DeploymentInfo {
  network: string;
  contractAddress: string;
  deployer: string;
  deploymentTx: string;
  blockNumber: number;
  timestamp: number;
  gasUsed: string;
  deploymentCost: string;
}

async function deployContract(
  network: 'base-mainnet' | 'base-sepolia',
  contractBytecode: string
): Promise<DeploymentInfo> {
  console.log(`\n🚀 Deploying CertificationRegistry to ${network}...\n`);

  // Setup provider
  const rpcUrl = network === 'base-mainnet'
    ? process.env.BASE_RPC_URL
    : 'https://sepolia.base.org'; // Base Sepolia testnet

  if (!rpcUrl) {
    throw new Error('BASE_RPC_URL not set in environment variables');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Setup wallet
  // Use DEPLOYER_PRIVATE_KEY if available, otherwise fall back to AGENT_PRIVATE_KEY
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY or AGENT_PRIVATE_KEY must be set in environment variables');
  }

  console.log(`🔑 Using ${process.env.DEPLOYER_PRIVATE_KEY ? 'DEPLOYER_PRIVATE_KEY' : 'AGENT_PRIVATE_KEY'} for deployment`);

  const wallet = new ethers.Wallet(privateKey, provider);
  const deployerAddress = await wallet.getAddress();

  console.log(`📍 Deployer address: ${deployerAddress}`);

  // Check balance
  const balance = await provider.getBalance(deployerAddress);
  const balanceEth = ethers.formatEther(balance);
  console.log(`💰 Deployer balance: ${balanceEth} ETH`);

  if (balance < ethers.parseEther('0.01')) {
    throw new Error('Insufficient balance. Need at least 0.01 ETH for deployment');
  }

  // Create contract factory
  const factory = new ethers.ContractFactory(
    CONTRACT_ABI,
    contractBytecode,
    wallet
  );

  // Estimate gas
  const deploymentData = factory.interface.encodeDeploy([]);
  const estimatedGas = await provider.estimateGas({
    from: deployerAddress,
    data: deploymentData,
  });
  console.log(`⛽ Estimated gas: ${estimatedGas.toString()}`);

  // Deploy contract
  console.log('\n⏳ Deploying contract...');
  const contract = await factory.deploy();

  console.log(`📝 Transaction hash: ${contract.deploymentTransaction()?.hash}`);
  console.log('⏳ Waiting for confirmation...');

  // Wait for deployment
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`✅ Contract deployed at: ${contractAddress}`);

  // Get deployment transaction details
  const deployTx = contract.deploymentTransaction();
  if (!deployTx) {
    throw new Error('Deployment transaction not found');
  }

  const receipt = await deployTx.wait();
  if (!receipt) {
    throw new Error('Transaction receipt not found');
  }

  const gasUsed = receipt.gasUsed.toString();
  const gasPrice = deployTx.gasPrice || BigInt(0);
  const deploymentCost = ethers.formatEther(receipt.gasUsed * gasPrice);

  console.log(`⛽ Gas used: ${gasUsed}`);
  console.log(`💸 Deployment cost: ${deploymentCost} ETH`);
  console.log(`📦 Block number: ${receipt.blockNumber}`);

  // Create deployment info
  const deploymentInfo: DeploymentInfo = {
    network,
    contractAddress,
    deployer: deployerAddress,
    deploymentTx: deployTx.hash,
    blockNumber: receipt.blockNumber,
    timestamp: Math.floor(Date.now() / 1000),
    gasUsed,
    deploymentCost,
  };

  // Save deployment info
  const deploymentsPath = join(process.cwd(), 'deployments.json');
  let deployments: Record<string, DeploymentInfo> = {};

  if (existsSync(deploymentsPath)) {
    const content = readFileSync(deploymentsPath, 'utf-8');
    deployments = JSON.parse(content);
  }

  deployments[network] = deploymentInfo;
  writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));

  console.log(`\n💾 Deployment info saved to deployments.json`);

  // Update .env file suggestion
  console.log(`\n📝 Add to your .env file:`);
  console.log(`CERTIFICATION_CONTRACT_ADDRESS=${contractAddress}`);

  return deploymentInfo;
}

async function verifyContract(
  contractAddress: string,
  _network: 'base-mainnet' | 'base-sepolia'
): Promise<void> {
  console.log(`\n🔍 Verifying contract on BaseScan...`);

  const basescanApiKey = process.env.BASESCAN_API_KEY;
  if (!basescanApiKey) {
    console.log('⚠️  BASESCAN_API_KEY not set. Skipping verification.');
    console.log('   You can verify manually at: https://basescan.org/verifyContract');
    return;
  }

  // Note: Actual verification requires the full source code and compiler settings
  // This is a simplified version - in production, use Hardhat verify plugin

  // API URL for verification (if using automated verification later)
  // const apiUrl = network === 'base-mainnet'
  //   ? 'https://api.basescan.org/api'
  //   : 'https://api-sepolia.basescan.org/api';

  console.log(`\n📋 Manual verification steps:`);
  console.log(`1. Go to: https://basescan.org/address/${contractAddress}#code`);
  console.log(`2. Click "Verify and Publish"`);
  console.log(`3. Compiler: Solidity (Single file)`);
  console.log(`4. Compiler version: v0.8.20+commit.a1b79de6`);
  console.log(`5. License: MIT`);
  console.log(`6. Upload contracts/CertificationRegistry.sol`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('  BaseGuardian - CertificationRegistry Deployment  ');
  console.log('='.repeat(60));

  // Check if contract bytecode exists
  // In a real scenario, you'd compile the Solidity contract first using:
  // - Hardhat: npx hardhat compile
  // - Foundry: forge build
  // - Or use solc directly

  console.log('\n⚠️  IMPORTANT: This script requires compiled contract bytecode.');
  console.log('   Please compile contracts/CertificationRegistry.sol first.');
  console.log('\n   Using Hardhat:');
  console.log('   $ npx hardhat compile\n');
  console.log('   Using Foundry:');
  console.log('   $ forge build\n');

  // For demonstration, we'll show what the deployment flow would look like
  // In production, you'd load the actual bytecode from the compilation output

  // Example bytecode (placeholder):
  // const exampleBytecode = '0x608060405234801561000...';

  // Uncomment when ready to deploy:
  // const targetNetwork = process.argv[2] as 'base-mainnet' | 'base-sepolia' || 'base-sepolia';
  // const deploymentInfo = await deployContract(targetNetwork, exampleBytecode);
  // await verifyContract(deploymentInfo.contractAddress, targetNetwork);

  console.log('\n✅ Deployment script loaded successfully!');
  console.log('\n📚 Next steps:');
  console.log('1. Compile the contract:');
  console.log('   $ npx hardhat compile  (or forge build)');
  console.log('2. Deploy to testnet first:');
  console.log('   $ tsx contracts/deploy.ts base-sepolia');
  console.log('3. Test the deployment');
  console.log('4. Deploy to mainnet:');
  console.log('   $ tsx contracts/deploy.ts base-mainnet');
  console.log('5. Verify on BaseScan');
  console.log('6. Update .env with contract address');
  console.log('7. Fund agent wallet with 0.5 ETH\n');
}

// Run if called directly (ES module check)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n❌ Deployment failed:');
      console.error(error);
      process.exit(1);
    });
}

export { deployContract, verifyContract };
