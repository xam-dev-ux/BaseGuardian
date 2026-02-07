/**
 * IPFS Storage Manager using Pinata API
 * Handles uploading and retrieving JSON metadata to/from IPFS
 */

import axios from 'axios';
import FormData from 'form-data';
import { appConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export class IPFSManager {
  private apiKey: string;
  private secretApiKey: string;

  constructor() {
    this.apiKey = appConfig.PINATA_API_KEY;
    this.secretApiKey = appConfig.PINATA_SECRET_KEY;

    if (!this.apiKey || !this.secretApiKey) {
      throw new Error('Pinata API credentials not configured');
    }
  }

  /**
   * Upload JSON data to IPFS via Pinata
   * @param data JSON object to upload
   * @param name Optional name for the pin
   * @returns IPFS hash (CID)
   */
  async uploadJSON(data: any, name?: string): Promise<string> {
    try {
      logger.info('ipfs_upload_start', { name });

      const response = await axios.post<PinataResponse>(
        `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
        {
          pinataContent: data,
          pinataMetadata: {
            name: name || `baseguardian-${Date.now()}`,
          },
          pinataOptions: {
            cidVersion: 1,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretApiKey,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      logger.info('ipfs_upload_success', { ipfsHash, name });

      return ipfsHash;
    } catch (error: any) {
      logger.error('ipfs_upload_failed', {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload file to IPFS via Pinata
   * @param fileBuffer File buffer
   * @param fileName File name
   * @returns IPFS hash (CID)
   */
  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      logger.info('ipfs_file_upload_start', { fileName });

      const formData = new FormData();
      formData.append('file', fileBuffer, fileName);

      const metadata = JSON.stringify({
        name: fileName,
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 1,
      });
      formData.append('pinataOptions', options);

      const response = await axios.post<PinataResponse>(
        `${PINATA_API_URL}/pinning/pinFileToIPFS`,
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            ...formData.getHeaders(),
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretApiKey,
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      logger.info('ipfs_file_upload_success', { ipfsHash, fileName });

      return ipfsHash;
    } catch (error: any) {
      logger.error('ipfs_file_upload_failed', {
        error: error.message,
        fileName,
      });
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  /**
   * Retrieve JSON data from IPFS
   * @param ipfsHash IPFS hash (CID)
   * @returns JSON object
   */
  async getJSON<T = any>(ipfsHash: string): Promise<T> {
    try {
      const url = `${PINATA_GATEWAY}/ipfs/${ipfsHash}`;
      const response = await axios.get<T>(url);
      return response.data;
    } catch (error: any) {
      logger.error('ipfs_get_failed', {
        error: error.message,
        ipfsHash,
      });
      throw new Error(`Failed to retrieve from IPFS: ${error.message}`);
    }
  }

  /**
   * Pin an existing IPFS hash (from another source)
   * @param ipfsHash IPFS hash to pin
   * @param name Optional name for the pin
   */
  async pinByHash(ipfsHash: string, name?: string): Promise<void> {
    try {
      await axios.post(
        `${PINATA_API_URL}/pinning/pinByHash`,
        {
          hashToPin: ipfsHash,
          pinataMetadata: {
            name: name || `pinned-${ipfsHash}`,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretApiKey,
          },
        }
      );

      logger.info('ipfs_pin_success', { ipfsHash, name });
    } catch (error: any) {
      logger.error('ipfs_pin_failed', {
        error: error.message,
        ipfsHash,
      });
      throw new Error(`Failed to pin IPFS hash: ${error.message}`);
    }
  }

  /**
   * Unpin (delete) content from Pinata
   * @param ipfsHash IPFS hash to unpin
   */
  async unpin(ipfsHash: string): Promise<void> {
    try {
      await axios.delete(`${PINATA_API_URL}/pinning/unpin/${ipfsHash}`, {
        headers: {
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretApiKey,
        },
      });

      logger.info('ipfs_unpin_success', { ipfsHash });
    } catch (error: any) {
      logger.error('ipfs_unpin_failed', {
        error: error.message,
        ipfsHash,
      });
      throw new Error(`Failed to unpin IPFS hash: ${error.message}`);
    }
  }

  /**
   * Test Pinata connection
   * @returns true if authenticated
   */
  async testAuthentication(): Promise<boolean> {
    try {
      await axios.get(`${PINATA_API_URL}/data/testAuthentication`, {
        headers: {
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretApiKey,
        },
      });
      logger.info('ipfs_auth_success');
      return true;
    } catch (error: any) {
      logger.error('ipfs_auth_failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get IPFS gateway URL for a hash
   * @param ipfsHash IPFS hash
   * @returns Full gateway URL
   */
  getGatewayUrl(ipfsHash: string): string {
    return `${PINATA_GATEWAY}/ipfs/${ipfsHash}`;
  }

  /**
   * Get public IPFS URL (ipfs.io)
   * @param ipfsHash IPFS hash
   * @returns Public IPFS URL
   */
  getPublicUrl(ipfsHash: string): string {
    return `https://ipfs.io/ipfs/${ipfsHash}`;
  }
}

// Singleton instance
let ipfsInstance: IPFSManager | null = null;

export function getIPFS(): IPFSManager {
  if (!ipfsInstance) {
    ipfsInstance = new IPFSManager();
  }
  return ipfsInstance;
}

export default IPFSManager;
