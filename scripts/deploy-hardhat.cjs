/**
 * Hardhat Deployment Script for CertificationRegistry
 * Run with: npx hardhat run scripts/deploy-hardhat.js --network base-sepolia
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log('='.repeat(60));
  console.log('  BaseGuardian - CertificationRegistry Deployment  ');
  console.log('='.repeat(60));

  // Get network
  const network = await hre.ethers.provider.getNetwork();
  const networkName = hre.network.name;
  console.log(`\n🌐 Network: ${networkName} (Chain ID: ${network.chainId})`);

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log(`\n📍 Deployer: ${deployerAddress}`);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  const balanceEth = hre.ethers.formatEther(balance);
  console.log(`💰 Balance: ${balanceEth} ETH`);

  if (balance < hre.ethers.parseEther('0.001')) {
    throw new Error('❌ Insufficient balance. Need at least 0.001 ETH for deployment');
  }

  // Deploy contract
  console.log('\n⏳ Deploying CertificationRegistry...');
  const CertificationRegistry = await hre.ethers.getContractFactory("CertificationRegistry");
  const contract = await CertificationRegistry.deploy();

  console.log(`📝 Transaction hash: ${contract.deploymentTransaction().hash}`);
  console.log('⏳ Waiting for confirmation...');

  // Wait for deployment
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`\n✅ Contract deployed at: ${contractAddress}`);

  // Get deployment details
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
  const deploymentCost = hre.ethers.formatEther(receipt.gasUsed * gasPrice);

  console.log(`⛽ Gas used: ${gasUsed}`);
  console.log(`💸 Deployment cost: ${deploymentCost} ETH`);
  console.log(`📦 Block number: ${receipt.blockNumber}`);

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    contractAddress,
    deployer: deployerAddress,
    deploymentTx: deployTx.hash,
    blockNumber: receipt.blockNumber,
    timestamp: Math.floor(Date.now() / 1000),
    gasUsed,
    deploymentCost,
  };

  const deploymentsPath = path.join(process.cwd(), 'deployments.json');
  let deployments = {};

  if (fs.existsSync(deploymentsPath)) {
    const content = fs.readFileSync(deploymentsPath, 'utf-8');
    deployments = JSON.parse(content);
  }

  deployments[networkName] = deploymentInfo;
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));

  console.log(`\n💾 Deployment info saved to deployments.json`);

  // Update .env instruction
  console.log(`\n📝 Update your .env file with:`);
  console.log(`CERTIFICATION_CONTRACT_ADDRESS=${contractAddress}`);

  // Verification instructions
  console.log(`\n🔍 To verify on BaseScan, run:`);
  console.log(`npx hardhat verify --network ${networkName} ${contractAddress}`);

  console.log(`\n🌐 View on BaseScan:`);
  const basescanUrl = networkName === 'base-mainnet'
    ? `https://basescan.org/address/${contractAddress}`
    : `https://sepolia.basescan.org/address/${contractAddress}`;
  console.log(basescanUrl);

  return {
    contractAddress,
    deploymentInfo,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });
