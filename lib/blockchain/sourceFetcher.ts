/**
 * BaseScan API Source Code Fetcher
 * Retrieves verified source code and ABI from BaseScan
 */

import axios from 'axios';
import { appConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

// Etherscan V2 API (unified endpoint with chainid)
const BASESCAN_API_URL = 'https://api.etherscan.io/v2/api';
const BASE_CHAIN_ID = 8453;

export interface ContractSource {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
}

export class SourceFetcher {
  private apiKey: string;
  private cache = new Map<string, ContractSource>();

  constructor() {
    this.apiKey = appConfig.BASESCAN_API_KEY;
  }

  /**
   * Fetch verified source code from BaseScan
   */
  async getSourceCode(contractAddress: string): Promise<ContractSource | null> {
    // Check cache first
    if (this.cache.has(contractAddress)) {
      logger.debug('Source code retrieved from cache', { contractAddress });
      return this.cache.get(contractAddress)!;
    }

    try {
      logger.info('Fetching source code from BaseScan', { contractAddress });

      const response = await axios.get(BASESCAN_API_URL, {
        params: {
          chainid: BASE_CHAIN_ID,
          module: 'contract',
          action: 'getsourcecode',
          address: contractAddress,
          apikey: this.apiKey,
        },
        timeout: 10000,
      });

      const data = response.data;

      if (data.status !== '1') {
        logger.warn('BaseScan API error', {
          contractAddress,
          message: data.message,
        });
        return null;
      }

      const result = data.result[0];

      // Check if contract is verified
      if (!result.SourceCode || result.SourceCode === '') {
        logger.info('Contract not verified on BaseScan', { contractAddress });
        return null;
      }

      const sourceData: ContractSource = result;

      // Cache the result
      this.cache.set(contractAddress, sourceData);

      logger.info('Source code retrieved successfully', {
        contractAddress,
        contractName: sourceData.ContractName,
        verified: true,
      });

      return sourceData;
    } catch (error: any) {
      logger.error('Failed to fetch source code', {
        contractAddress,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get contract ABI from BaseScan
   */
  async getABI(contractAddress: string): Promise<any[] | null> {
    const source = await this.getSourceCode(contractAddress);

    if (!source || !source.ABI) {
      return null;
    }

    try {
      return JSON.parse(source.ABI);
    } catch (error: any) {
      logger.error('Failed to parse ABI', {
        contractAddress,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Check if contract is verified
   */
  async isVerified(contractAddress: string): Promise<boolean> {
    const source = await this.getSourceCode(contractAddress);
    return source !== null && source.SourceCode !== '';
  }

  /**
   * Get contract creation info
   */
  async getCreationInfo(contractAddress: string): Promise<{
    contractAddress: string;
    contractCreator: string;
    txHash: string;
  } | null> {
    try {
      const response = await axios.get(BASESCAN_API_URL, {
        params: {
          chainid: BASE_CHAIN_ID,
          module: 'contract',
          action: 'getcontractcreation',
          contractaddresses: contractAddress,
          apikey: this.apiKey,
        },
        timeout: 10000,
      });

      const data = response.data;

      if (data.status !== '1' || !data.result || data.result.length === 0) {
        return null;
      }

      return data.result[0];
    } catch (error: any) {
      logger.error('Failed to fetch creation info', {
        contractAddress,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Source code cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Singleton instance
let fetcherInstance: SourceFetcher | null = null;

export function getSourceFetcher(): SourceFetcher {
  if (!fetcherInstance) {
    fetcherInstance = new SourceFetcher();
  }
  return fetcherInstance;
}

export default SourceFetcher;
