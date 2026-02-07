/**
 * Contract Deployment Detector
 * Detects new contract deployments on Base Mainnet
 */

import { ethers } from 'ethers';
import { getProvider } from './provider.js';
import { getDatabase } from '../storage/db.js';
import { logger, logContractDetected } from '../utils/logger.js';
import crypto from 'crypto';

export interface DetectedContract {
  address: string;
  deployer: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  bytecodeHash?: string;
}

export class ContractDetector {
  private provider = getProvider();
  private db = getDatabase();
  private isMonitoring = false;
  private processedContracts = new Set<string>();

  /**
   * Start monitoring for new contract deployments via WebSocket
   */
  async startMonitoring(callback: (contract: DetectedContract) => Promise<void>): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Contract monitoring already active');
      return;
    }

    logger.info('Starting contract deployment monitoring');
    this.isMonitoring = true;

    try {
      const wsProvider = await this.provider.getWsProvider();

      // Listen for new blocks
      wsProvider.on('block', async (blockNumber: number) => {
        await this.scanBlock(blockNumber, callback);
      });

      logger.info('Contract monitoring started successfully');
    } catch (error: any) {
      logger.error('Failed to start monitoring', { error: error.message });
      this.isMonitoring = false;
      throw error;
    }
  }

  /**
   * Scan a specific block for contract deployments
   */
  async scanBlock(
    blockNumber: number,
    callback: (contract: DetectedContract) => Promise<void>
  ): Promise<void> {
    try {
      // Fetch block with transactions using HTTP provider (more reliable)
      const block = await this.provider.getBlock(blockNumber, true);

      if (!block || !block.transactions) {
        return;
      }

      logger.info('Scanning block for deployments', {
        blockNumber,
        txCount: block.transactions.length,
      });

      // Filter for contract deployment transactions (to === null)
      for (const tx of block.transactions) {
        if (typeof tx === 'string') continue; // Skip if only hash

        const transaction = tx as ethers.TransactionResponse;

        // Contract deployment = transaction with no recipient
        if (transaction.to === null) {
          await this.processDeployment(transaction, callback);
        }
      }
    } catch (error: any) {
      logger.error('Error scanning block', {
        blockNumber,
        error: error.message,
      });
    }
  }

  /**
   * Process a contract deployment transaction
   */
  private async processDeployment(
    tx: ethers.TransactionResponse,
    callback: (contract: DetectedContract) => Promise<void>
  ): Promise<void> {
    try {
      // Wait for transaction receipt to get contract address
      const receipt = await this.provider.getTransactionReceipt(tx.hash);

      if (!receipt || !receipt.contractAddress) {
        return;
      }

      const contractAddress = receipt.contractAddress;

      // Skip if already processed
      if (this.processedContracts.has(contractAddress)) {
        return;
      }

      // Check if already in database
      const existing = this.db.getDeployment(contractAddress);
      if (existing) {
        this.processedContracts.add(contractAddress);
        return;
      }

      // Get bytecode and compute hash
      const bytecode = await this.provider.getCode(contractAddress);
      const bytecodeHash = this.computeHash(bytecode);

      // Get block for timestamp
      const block = await this.provider.getBlock(receipt.blockNumber);
      const timestamp = block?.timestamp || Math.floor(Date.now() / 1000);

      const detectedContract: DetectedContract = {
        address: contractAddress,
        deployer: tx.from,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        timestamp,
        bytecodeHash,
      };

      // Log detection
      logContractDetected(contractAddress, tx.from, receipt.blockNumber);

      // Save to database
      this.db.insertDeployment({
        contract_address: contractAddress,
        deployer_address: tx.from,
        tx_hash: tx.hash,
        block_number: receipt.blockNumber,
        timestamp,
        bytecode_hash: bytecodeHash,
      });

      // Mark as processed
      this.processedContracts.add(contractAddress);

      // Trigger callback for further processing
      await callback(detectedContract);
    } catch (error: any) {
      logger.error('Error processing deployment', {
        txHash: tx.hash,
        error: error.message,
      });
    }
  }

  /**
   * Scan historical blocks for missed deployments
   */
  async scanHistoricalBlocks(
    fromBlock: number,
    toBlock: number,
    callback: (contract: DetectedContract) => Promise<void>
  ): Promise<void> {
    logger.info('Scanning historical blocks', { fromBlock, toBlock });

    const CHUNK_SIZE = 100; // Process in chunks to avoid rate limits

    for (let i = fromBlock; i <= toBlock; i += CHUNK_SIZE) {
      const endBlock = Math.min(i + CHUNK_SIZE - 1, toBlock);

      logger.info('Scanning chunk', { from: i, to: endBlock });

      for (let blockNumber = i; blockNumber <= endBlock; blockNumber++) {
        await this.scanBlock(blockNumber, callback);

        // Small delay to avoid rate limiting
        await this.sleep(100);
      }
    }

    logger.info('Historical scan complete', { fromBlock, toBlock });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    logger.info('Contract monitoring stopped');
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Compute hash of bytecode
   */
  private computeHash(bytecode: string): string {
    return crypto.createHash('sha256').update(bytecode).digest('hex');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let detectorInstance: ContractDetector | null = null;

export function getDetector(): ContractDetector {
  if (!detectorInstance) {
    detectorInstance = new ContractDetector();
  }
  return detectorInstance;
}

export default ContractDetector;
