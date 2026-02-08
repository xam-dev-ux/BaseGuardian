/**
 * Deploy a simple SAFE contract to test BaseGuardian certification
 */
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Simple Storage contract - completely safe, no vulnerabilities
const SIMPLE_CONTRACT_BYTECODE = '0x608060405234801561001057600080fd5b5060c78061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806360fe47b11460375780636d4ce63c146048575b600080fd5b60466042366004605e565b6000555b005b60005460405190815260200160405180910390f35b600060208284031215606f57600080fd5b503591905056fea264697066735822122038e7fcd3c4f1c8b1d7a1e5b5b9f8c5d3e7a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c364736f6c63430008140033';

async function main() {
  console.log('Deploying test contract to Base Mainnet...\n');

  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);

  console.log('Wallet:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH\n');

  if (balance < ethers.parseEther('0.0001')) {
    console.log('Insufficient balance for deployment');
    process.exit(1);
  }

  const factory = new ethers.ContractFactory([], SIMPLE_CONTRACT_BYTECODE, wallet);

  console.log('Deploying SimpleStorage contract...');
  const contract = await factory.deploy();

  console.log('TX Hash:', contract.deploymentTransaction().hash);
  console.log('Waiting for confirmation...\n');

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('Contract deployed!');
  console.log('Address:', address);
  console.log('BaseScan: https://basescan.org/address/' + address);
  console.log('\nBaseGuardian should detect and analyze this contract soon...');
}

main().catch(console.error);
