/**
 * Health Check HTTP Server
 * Provides endpoint for monitoring agent status
 */

import express from 'express';
import { getDatabase } from '../storage/db.js';
import { getProvider } from '../blockchain/provider.js';
import { logger } from '../utils/logger.js';
import { appConfig } from '../utils/config.js';

export class HealthCheckServer {
  private app = express();
  private server: any = null;

  constructor() {
    this.setupRoutes();
  }

  /**
   * Setup HTTP routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (_req, res) => {
      try {
        const health = await this.getHealthStatus();
        const statusCode = health.healthy ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error: any) {
        logger.error('Health check endpoint error', { error: error.message });
        res.status(500).json({
          healthy: false,
          error: error.message,
        });
      }
    });

    // Stats endpoint
    this.app.get('/stats', async (_req, res) => {
      try {
        const db = getDatabase();
        const stats = db.getDailyStats();
        res.json(stats);
      } catch (error: any) {
        logger.error('Stats endpoint error', { error: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        name: 'BaseGuardian',
        description: 'Autonomous AI security agent for Base Mainnet',
        status: 'running',
        endpoints: ['/health', '/stats'],
      });
    });
  }

  /**
   * Get comprehensive health status
   */
  private async getHealthStatus(): Promise<any> {
    const provider = getProvider();
    const db = getDatabase();

    // Check blockchain connection
    let blockchainHealthy = false;
    let currentBlock = 0;
    try {
      currentBlock = await provider.getBlockNumber();
      blockchainHealthy = currentBlock > 0;
    } catch (error: any) {
      logger.error('Blockchain health check failed', { error: error.message });
    }

    // Check wallet balance
    let balance = '0';
    let balanceEth = 0;
    let balanceSufficient = false;
    try {
      const balanceBigInt = await provider.getBalance(appConfig.AGENT_ADDRESS);
      balance = balanceBigInt.toString();
      balanceEth = Number(balanceBigInt) / 1e18;
      balanceSufficient = balanceEth >= 0.001;
    } catch (error: any) {
      logger.error('Balance check failed', { error: error.message });
    }

    // Get database stats
    const stats = db.getDailyStats();

    const healthy = blockchainHealthy && balanceSufficient;

    return {
      healthy,
      timestamp: new Date().toISOString(),
      blockchain: {
        connected: blockchainHealthy,
        currentBlock,
      },
      wallet: {
        address: appConfig.AGENT_ADDRESS,
        balance,
        balanceEth: balanceEth.toFixed(6),
        sufficient: balanceSufficient,
        minimumRequired: '0.001 ETH',
      },
      stats: {
        contractsScanned: stats.contracts_scanned,
        scamsDetected: stats.scams_detected,
        safeCertified: stats.safe_certified,
        warningsIssued: stats.warnings_issued,
      },
      uptime: process.uptime(),
    };
  }

  /**
   * Start HTTP server
   */
  start(): void {
    const port = appConfig.HEALTH_CHECK_PORT || 3000;

    this.server = this.app.listen(port, () => {
      logger.info('Health check server started', { port });
    });
  }

  /**
   * Stop HTTP server
   */
  stop(): void {
    if (this.server) {
      this.server.close(() => {
        logger.info('Health check server stopped');
      });
    }
  }
}

// Singleton instance
let healthServerInstance: HealthCheckServer | null = null;

export function getHealthServer(): HealthCheckServer {
  if (!healthServerInstance) {
    healthServerInstance = new HealthCheckServer();
  }
  return healthServerInstance;
}

export default HealthCheckServer;
