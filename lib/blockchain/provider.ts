/**
 * Blockchain Provider Manager for Base Mainnet
 * Manages WebSocket and HTTP connections with reconnection logic
 */

import { ethers, WebSocketProvider, JsonRpcProvider } from 'ethers';
import { appConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export class ProviderManager {
  private wsProvider: WebSocketProvider | null = null;
  private httpProvider: JsonRpcProvider;

  constructor() {
    // HTTP provider (always available, more reliable for queries)
    this.httpProvider = new JsonRpcProvider(appConfig.BASE_RPC_URL);
    logger.info('HTTP provider initialized', { url: appConfig.BASE_RPC_URL });
  }

  /**
   * Get HTTP provider (reliable for queries)
   */
  getHttpProvider(): JsonRpcProvider {
    return this.httpProvider;
  }

  /**
   * Get or create WebSocket provider (for real-time events)
   */
  async getWsProvider(): Promise<WebSocketProvider> {
    if (this.wsProvider && this.wsProvider.websocket.readyState === 1) {
      return this.wsProvider;
    }

    return this.connectWebSocket();
  }

  /**
   * Connect to WebSocket with error handling
   */
  private async connectWebSocket(): Promise<WebSocketProvider> {
    try {
      logger.info('Connecting to WebSocket provider', { url: appConfig.BASE_WSS_URL });

      this.wsProvider = new WebSocketProvider(appConfig.BASE_WSS_URL);

      // Wait for connection
      await this.wsProvider.ready;
      logger.info('WebSocket connected successfully');

      // Monitor connection health via ping
      this.monitorWebSocketHealth();

      return this.wsProvider;
    } catch (error: any) {
      logger.error('Failed to connect WebSocket', { error: error.message });
      throw error;
    }
  }

  /**
   * Monitor WebSocket health with periodic checks
   */
  private monitorWebSocketHealth(): void {
    setInterval(async () => {
      try {
        if (this.wsProvider && this.wsProvider.websocket.readyState === 1) {
          // Connection healthy
          return;
        }
        logger.warn('WebSocket disconnected, attempting reconnection');
        await this.connectWebSocket();
      } catch (error: any) {
        logger.error('WebSocket health check failed', { error: error.message });
      }
    }, 30000); // Check every 30 seconds
  }


  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.httpProvider.getBlockNumber();
  }

  /**
   * Get block with transactions
   */
  async getBlock(blockNumber: number, prefetchTxs: boolean = true): Promise<ethers.Block | null> {
    return await this.httpProvider.getBlock(blockNumber, prefetchTxs);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    return await this.httpProvider.getTransactionReceipt(txHash);
  }

  /**
   * Get contract code
   */
  async getCode(address: string): Promise<string> {
    return await this.httpProvider.getCode(address);
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<bigint> {
    return await this.httpProvider.getBalance(address);
  }

  /**
   * Create contract instance
   */
  getContract(address: string, abi: any): ethers.Contract {
    return new ethers.Contract(address, abi, this.httpProvider);
  }

  /**
   * Create wallet instance for signing transactions
   */
  getWallet(): ethers.Wallet {
    return new ethers.Wallet(appConfig.AGENT_PRIVATE_KEY, this.httpProvider);
  }

  /**
   * Test connection health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const blockNumber = await this.getBlockNumber();
      logger.info('Provider health check passed', { blockNumber });
      return true;
    } catch (error: any) {
      logger.error('Provider health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * Cleanup and close connections
   */
  async close(): Promise<void> {
    if (this.wsProvider) {
      this.wsProvider.destroy();
      this.wsProvider = null;
    }
    logger.info('Provider connections closed');
  }
}

// Singleton instance
let providerInstance: ProviderManager | null = null;

export function getProvider(): ProviderManager {
  if (!providerInstance) {
    providerInstance = new ProviderManager();
  }
  return providerInstance;
}

export default ProviderManager;
