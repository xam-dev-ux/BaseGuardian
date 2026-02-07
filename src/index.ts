/**
 * BaseGuardian Main Entry Point
 * Autonomous security agent for Base Mainnet
 */

import { getDetector } from '../lib/blockchain/detector.js';
import { getProvider } from '../lib/blockchain/provider.js';
import { getSourceFetcher } from '../lib/blockchain/sourceFetcher.js';
import { getClaudeAnalyzer } from '../lib/analysis/claudeAnalyzer.js';
import { getTwitterClient } from '../lib/social/twitter.js';
import { getCertifier } from '../lib/blockchain/certifier.js';
import { getDatabase } from '../lib/storage/db.js';
import { getHealthServer } from '../lib/health/server.js';
import { logger } from '../lib/utils/logger.js';
import { appConfig, validateConfig } from '../lib/utils/config.js';
import type { DetectedContract } from '../lib/blockchain/detector.js';

class BaseGuardian {
  private detector = getDetector();
  private provider = getProvider();
  private sourceFetcher = getSourceFetcher();
  private analyzer = getClaudeAnalyzer();
  private twitter = getTwitterClient();
  private certifier = getCertifier();
  private db = getDatabase();
  private healthServer = getHealthServer();

  /**
   * Start BaseGuardian agent
   */
  async start(): Promise<void> {
    try {
      logger.info('🦞 BaseGuardian - Starting autonomous security agent');

      // Validate configuration
      validateConfig();
      logger.info('✅ Configuration validated');

      // Start health check server
      this.healthServer.start();

      // Test connections
      await this.testConnections();

      // Start monitoring
      await this.startMonitoring();

      // Setup periodic tasks
      this.setupPeriodicTasks();

      logger.info('🛡️ BaseGuardian is now protecting Base Mainnet');
    } catch (error: any) {
      logger.error('Failed to start BaseGuardian', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Test all external connections
   */
  private async testConnections(): Promise<void> {
    logger.info('Testing external connections...');

    // Test blockchain connection
    const blockNumber = await this.provider.getBlockNumber();
    logger.info('✅ Blockchain connected', { blockNumber });

    // Test wallet balance
    const balance = await this.provider.getBalance(appConfig.AGENT_ADDRESS);
    const balanceEth = Number(balance) / 1e18;
    logger.info('✅ Agent wallet', {
      address: appConfig.AGENT_ADDRESS,
      balance: `${balanceEth.toFixed(4)} ETH`,
    });

    if (balanceEth < 0.001) {
      logger.warn('⚠️ Low wallet balance! Need at least 0.001 ETH');
    }

    // Test Twitter
    if (appConfig.ENABLE_TWITTER) {
      const twitterOk = await this.twitter.testConnection();
      if (twitterOk) {
        logger.info('✅ Twitter connected');
      } else {
        logger.warn('⚠️ Twitter connection failed');
      }
    }

    logger.info('All connections tested');
  }

  /**
   * Start contract monitoring
   */
  private async startMonitoring(): Promise<void> {
    logger.info('Starting contract deployment monitoring...');

    await this.detector.startMonitoring(async (contract: DetectedContract) => {
      await this.processNewContract(contract);
    });

    logger.info('✅ Monitoring active');
  }

  /**
   * Process newly detected contract
   */
  private async processNewContract(contract: DetectedContract): Promise<void> {
    try {
      logger.info('Processing new contract', {
        address: contract.address,
        deployer: contract.deployer,
      });

      // Fetch source code
      const source = await this.sourceFetcher.getSourceCode(contract.address);
      const isVerified = source !== null;

      // Get bytecode if not verified
      let bytecode: string | undefined;
      if (!isVerified) {
        bytecode = await this.provider.getCode(contract.address);
      }

      // Analyze with Claude
      logger.info('Analyzing contract with Claude AI', { address: contract.address });
      const analysis = await this.analyzer.analyzeContract(
        contract.address,
        source?.SourceCode,
        bytecode,
        {
          deployer: contract.deployer,
          blockNumber: contract.blockNumber,
          timestamp: contract.timestamp,
        }
      );

      // Save analysis to database
      this.db.insertAnalysis({
        contract_address: contract.address,
        source_code: source?.SourceCode,
        is_verified: isVerified,
        risk_score: analysis.safety_score, // DB uses risk_score column but we store safety_score
        classification: analysis.classification,
        threats: JSON.stringify(analysis.threats),
        explanation: analysis.explanation,
        confidence: analysis.confidence,
      });

      logger.info('Analysis complete', {
        address: contract.address,
        classification: analysis.classification,
        safetyScore: analysis.safety_score,
      });

      // Take action based on classification
      await this.takeAction(contract.address, analysis);
    } catch (error: any) {
      logger.error('Failed to process contract', {
        address: contract.address,
        error: error.message,
      });
    }
  }

  /**
   * Take action based on analysis
   * Note: SCAM_THRESHOLD is now a SAFETY threshold (lower score = more dangerous)
   * SCAM if safety_score < 40 (configurable via SCAM_THRESHOLD)
   */
  private async takeAction(
    contractAddress: string,
    analysis: any
  ): Promise<void> {
    // SCAM - Post alert immediately (low safety score = dangerous)
    // Note: We invert the threshold check since safety_score is inverted from old risk_score
    const scamThreshold = 100 - appConfig.SCAM_THRESHOLD; // Convert: 70 risk threshold -> 30 safety threshold
    if (analysis.classification === 'SCAM' || analysis.safety_score < scamThreshold) {
      logger.warn('SCAM detected, posting alert', { address: contractAddress });

      if (appConfig.ENABLE_TWITTER) {
        await this.twitter.postScamAlert({
          contractAddress,
          type: 'scam_alert',
          riskScore: 100 - analysis.safety_score, // Convert back for Twitter display
          threats: analysis.threats,
        });
      }

      return;
    }

    // SAFE - Certify onchain (high safety score = safe)
    if (
      analysis.classification === 'SAFE' &&
      analysis.safety_score >= 80 &&
      analysis.confidence >= 75
    ) {
      logger.info('Safe contract detected, certifying', { address: contractAddress });

      // Check if already certified
      const alreadyCertified = await this.certifier.isCertified(contractAddress);
      if (alreadyCertified) {
        logger.info('Contract already certified, skipping', { address: contractAddress });
        return;
      }

      // Certify onchain
      if (appConfig.ENABLE_CERTIFICATIONS) {
        const txHash = await this.certifier.certifyContract(contractAddress, analysis);

        if (txHash && appConfig.ENABLE_TWITTER) {
          // Post certification announcement
          await this.twitter.postCertification({
            contractAddress,
            type: 'certification',
            riskScore: 100 - analysis.safety_score, // Convert for display consistency
            txHash,
          });
        }
      }

      return;
    }

    // SUSPICIOUS - Log and monitor
    logger.info('Suspicious contract detected, monitoring', {
      address: contractAddress,
      safetyScore: analysis.safety_score,
    });
  }

  /**
   * Setup periodic tasks
   */
  private setupPeriodicTasks(): void {
    // Post daily stats (every 24 hours)
    setInterval(
      async () => {
        await this.postDailyStats();
      },
      24 * 60 * 60 * 1000
    );

    // Health check (every hour)
    setInterval(
      async () => {
        await this.healthCheck();
      },
      60 * 60 * 1000
    );

    logger.info('Periodic tasks scheduled');
  }

  /**
   * Post daily statistics
   */
  private async postDailyStats(): Promise<void> {
    try {
      const stats = this.db.getDailyStats();

      logger.info('Daily stats', stats);

      if (appConfig.ENABLE_TWITTER) {
        await this.twitter.postDailyStats(stats);
      }
    } catch (error: any) {
      logger.error('Failed to post daily stats', { error: error.message });
    }
  }

  /**
   * Health check
   */
  private async healthCheck(): Promise<void> {
    try {
      const healthy = await this.provider.healthCheck();

      if (!healthy) {
        logger.error('Health check failed - provider unhealthy');
      }

      const balance = await this.provider.getBalance(appConfig.AGENT_ADDRESS);
      const balanceEth = Number(balance) / 1e18;

      if (balanceEth < 0.001) {
        logger.error('Health check failed - low balance', {
          balance: `${balanceEth.toFixed(4)} ETH`,
        });
      }

      logger.info('Health check passed', {
        balance: `${balanceEth.toFixed(4)} ETH`,
        monitoring: this.detector.isActive(),
      });
    } catch (error: any) {
      logger.error('Health check failed', { error: error.message });
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down BaseGuardian...');

    this.detector.stopMonitoring();
    this.healthServer.stop();
    await this.provider.close();
    this.db.close();

    logger.info('Shutdown complete');
    process.exit(0);
  }
}

// Create and start agent
const agent = new BaseGuardian();

// Handle shutdown signals
process.on('SIGINT', () => agent.shutdown());
process.on('SIGTERM', () => agent.shutdown());

// Start agent
agent.start().catch((error) => {
  logger.error('Fatal error', { error: error.message });
  process.exit(1);
});

export default BaseGuardian;
