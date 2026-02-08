/**
 * Health Check HTTP Server
 * Provides endpoint for monitoring agent status
 */

import express from 'express';
import cors from 'cors';
import { getDatabase } from '../storage/db.js';
import { getProvider } from '../blockchain/provider.js';
import { logger } from '../utils/logger.js';
import { appConfig } from '../utils/config.js';

export class HealthCheckServer {
  private app = express();
  private server: any = null;

  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Enable CORS for frontend
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3000', /\.vercel\.app$/],
      methods: ['GET', 'POST'],
    }));
    this.app.use(express.json());
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
        endpoints: ['/health', '/stats', '/api/analyses', '/api/certifications', '/api/contract/:address'],
      });
    });

    // API: Get all analyses
    this.app.get('/api/analyses', async (req, res) => {
      try {
        const db = getDatabase();
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const classification = req.query.classification as string;

        const analyses = db.getAnalyses({ limit, offset, classification });

        // Parse threats JSON
        const parsed = analyses.map((a: any) => ({
          ...a,
          threats: JSON.parse(a.threats || '[]'),
          is_verified: Boolean(a.is_verified),
        }));

        res.json({
          success: true,
          data: parsed,
          count: parsed.length,
        });
      } catch (error: any) {
        logger.error('Analyses endpoint error', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Get all certifications
    this.app.get('/api/certifications', async (_req, res) => {
      try {
        const db = getDatabase();
        const certifications = db.getCertificationsWithAnalyses();

        const parsed = certifications.map((c: any) => ({
          ...c,
          threats: JSON.parse(c.threats || '[]'),
          stake_eth: (Number(c.stake_amount) / 1e18).toFixed(6),
          basescan_tx: `https://basescan.org/tx/${c.tx_hash}`,
          ipfs_url: `https://gateway.pinata.cloud/ipfs/${c.ipfs_hash}`,
        }));

        res.json({
          success: true,
          data: parsed,
          count: parsed.length,
        });
      } catch (error: any) {
        logger.error('Certifications endpoint error', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Get contract details
    this.app.get('/api/contract/:address', async (req, res) => {
      try {
        const db = getDatabase();
        const address = req.params.address;

        const details = db.getContractDetails(address);

        if (!details) {
          res.status(404).json({ success: false, error: 'Contract not found' });
          return;
        }

        const { analysis, certification } = details;

        res.json({
          success: true,
          data: {
            address,
            analysis: analysis ? {
              ...analysis,
              threats: JSON.parse(analysis.threats || '[]'),
              is_verified: Boolean(analysis.is_verified),
            } : null,
            certification: certification ? {
              ...certification,
              stake_eth: (Number(certification.stake_amount) / 1e18).toFixed(6),
              basescan_tx: `https://basescan.org/tx/${certification.tx_hash}`,
              ipfs_url: `https://gateway.pinata.cloud/ipfs/${certification.ipfs_hash}`,
            } : null,
          },
        });
      } catch (error: any) {
        logger.error('Contract endpoint error', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Get SCAM contracts (for alerts)
    this.app.get('/api/scams', async (_req, res) => {
      try {
        const db = getDatabase();
        const scams = db.getScamContracts();

        const parsed = scams.map((s: any) => ({
          ...s,
          threats: JSON.parse(s.threats || '[]'),
        }));

        res.json({
          success: true,
          data: parsed,
          count: parsed.length,
        });
      } catch (error: any) {
        logger.error('Scams endpoint error', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
      }
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
      balanceSufficient = balanceEth >= 0.0001;
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
        minimumRequired: '0.0001 ETH',
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
