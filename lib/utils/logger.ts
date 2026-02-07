/**
 * Winston Logger Configuration for BaseGuardian
 * Provides structured logging to console and files
 */

import winston from 'winston';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Ensure logs directory exists
const logsDir = join(process.cwd(), 'data', 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Custom format for console (colored and readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// JSON format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'baseguardian' },
  transports: [
    // Console transport (human-readable)
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // Combined log file (all levels)
    new winston.transports.File({
      filename: join(logsDir, 'agent.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 30, // Keep 30 days
    }),

    // Error log file (errors only)
    new winston.transports.File({
      filename: join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30,
    }),
  ],
});

// Helper functions for common log patterns
export const logContractDetected = (address: string, deployer: string, blockNumber: number) => {
  logger.info('contract_detected', {
    contract_address: address,
    deployer_address: deployer,
    block_number: blockNumber,
  });
};

export const logContractAnalyzed = (address: string, riskScore: number, classification: string) => {
  logger.info('contract_analyzed', {
    contract_address: address,
    risk_score: riskScore,
    classification,
  });
};

export const logCertificationIssued = (address: string, txHash: string, stakeAmount: string) => {
  logger.info('certification_issued', {
    contract_address: address,
    tx_hash: txHash,
    stake_amount: stakeAmount,
  });
};

export const logSocialPost = (platform: string, postType: string, success: boolean) => {
  logger.info('social_post', {
    platform,
    post_type: postType,
    success,
  });
};

export const logError = (context: string, error: Error, metadata?: any) => {
  logger.error(`error_${context}`, {
    error_message: error.message,
    error_stack: error.stack,
    ...metadata,
  });
};

export default logger;
