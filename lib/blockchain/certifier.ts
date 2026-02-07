/**
 * Onchain Certification Manager
 * Handles certification of safe contracts with staking
 */

import { ethers } from 'ethers';
import { getProvider } from './provider.js';
import { getIPFS } from '../storage/ipfs.js';
import { getDatabase } from '../storage/db.js';
import { logger, logCertificationIssued } from '../utils/logger.js';
import { appConfig } from '../utils/config.js';

const CERTIFICATION_ABI = [
  'function certify(address _contractAddress, string memory _ipfsHash, uint256 _riskScore) external payable',
  'function getCertification(address _contractAddress) external view returns (tuple(address contractAddress, address guardian, string ipfsHash, uint256 riskScore, uint256 stakeAmount, uint256 timestamp, bool active, uint256 challengeCount))',
  'function isCertified(address _contractAddress) external view returns (bool)',
];

export class CertificationManager {
  private provider = getProvider();
  private ipfs = getIPFS();
  private db = getDatabase();

  /**
   * Certify a safe contract onchain
   */
  async certifyContract(
    contractAddress: string,
    analysis: {
      risk_score: number;
      classification: string;
      threats: string[];
      explanation: string;
      confidence: number;
    }
  ): Promise<string | null> {
    try {
      logger.info('Starting onchain certification', { contractAddress });

      // Create certification metadata
      const metadata = {
        contract_address: contractAddress,
        chain_id: appConfig.CHAIN_ID,
        certification_date: new Date().toISOString(),
        risk_score: analysis.risk_score,
        analysis: {
          threats_found: analysis.threats,
          classification: analysis.classification,
          explanation: analysis.explanation,
          confidence: analysis.confidence,
        },
        guardian: 'BaseGuardian',
        guardian_address: appConfig.AGENT_ADDRESS,
        version: '1.0.0',
      };

      // Upload metadata to IPFS
      logger.info('Uploading certification metadata to IPFS');
      const ipfsHash = await this.ipfs.uploadJSON(
        metadata,
        `baseguardian-cert-${contractAddress}`
      );

      logger.info('Metadata uploaded', { ipfsHash });

      // Calculate stake amount based on confidence (min 0.001 ETH)
      const stakeEth = Math.max(0.001, (analysis.confidence / 100) * 0.01);
      const stakeAmount = ethers.parseEther(stakeEth.toString());

      // Get certification contract
      const wallet = this.provider.getWallet();
      const certContract = new ethers.Contract(
        appConfig.CERTIFICATION_CONTRACT_ADDRESS!,
        CERTIFICATION_ABI,
        wallet
      );

      // Submit certification transaction
      logger.info('Submitting certification transaction', {
        contractAddress,
        ipfsHash,
        riskScore: analysis.risk_score,
        stakeAmount: ethers.formatEther(stakeAmount),
      });

      const tx = await certContract.certify(contractAddress, ipfsHash, analysis.risk_score, {
        value: stakeAmount,
      });

      logger.info('Transaction submitted', { txHash: tx.hash });

      // Wait for confirmation
      const receipt = await tx.wait();

      logger.info('Certification confirmed', {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      // Log to database
      this.db.insertCertification({
        contract_address: contractAddress,
        ipfs_hash: ipfsHash,
        stake_amount: stakeAmount.toString(),
        tx_hash: receipt.hash,
      });

      logCertificationIssued(contractAddress, receipt.hash, stakeAmount.toString());

      return receipt.hash;
    } catch (error: any) {
      logger.error('Certification failed', {
        contractAddress,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Check if contract is already certified
   */
  async isCertified(contractAddress: string): Promise<boolean> {
    try {
      const httpProvider = this.provider.getHttpProvider();
      const certContract = new ethers.Contract(
        appConfig.CERTIFICATION_CONTRACT_ADDRESS!,
        CERTIFICATION_ABI,
        httpProvider
      );

      return await certContract.isCertified(contractAddress);
    } catch (error: any) {
      logger.error('Failed to check certification status', {
        contractAddress,
        error: error.message,
      });
      return false;
    }
  }
}

export function getCertifier(): CertificationManager {
  return new CertificationManager();
}

export default CertificationManager;
