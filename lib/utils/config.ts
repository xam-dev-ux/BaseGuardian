/**
 * Configuration Manager for BaseGuardian
 * Loads and validates environment variables
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load .env file
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  config({ path: envPath });
}

interface Config {
  // Blockchain
  BASE_RPC_URL: string;
  BASE_WSS_URL: string;
  BASE_RPC_BACKUP: string;
  BASESCAN_API_KEY: string;
  CHAIN_ID: number;

  // Agent Wallet
  AGENT_PRIVATE_KEY: string;
  AGENT_ADDRESS: string;

  // Smart Contracts
  CERTIFICATION_CONTRACT_ADDRESS?: string;

  // Anthropic Claude
  ANTHROPIC_API_KEY: string;
  CLAUDE_MODEL: string;
  CLAUDE_MAX_TOKENS: number;
  CLAUDE_TEMPERATURE: number;

  // Twitter
  TWITTER_API_KEY: string;
  TWITTER_API_SECRET: string;
  TWITTER_ACCESS_TOKEN: string;
  TWITTER_ACCESS_SECRET: string;
  TWITTER_BEARER_TOKEN?: string;

  // Farcaster
  NEYNAR_API_KEY: string;
  FARCASTER_SIGNER_UUID: string;
  FARCASTER_FID?: string;

  // IPFS
  PINATA_API_KEY: string;
  PINATA_SECRET_KEY: string;
  PINATA_JWT?: string;

  // EAS
  EAS_CONTRACT_ADDRESS: string;
  EAS_SCHEMA_UID?: string;

  // Rate Limiting
  TWITTER_MAX_POSTS_PER_HOUR: number;
  FARCASTER_MAX_POSTS_PER_HOUR: number;
  MIN_POST_INTERVAL_SECONDS: number;
  MAX_POST_INTERVAL_SECONDS: number;

  // Redis
  REDIS_URL: string;
  REDIS_PASSWORD?: string;

  // Database
  SQLITE_DB_PATH: string;

  // Monitoring
  HEALTH_CHECK_PORT: number;
  LOG_LEVEL: string;

  // Feature Flags
  ENABLE_CERTIFICATIONS: boolean;
  ENABLE_TWITTER: boolean;
  ENABLE_FARCASTER: boolean;
  ENABLE_AUTO_STAKE: boolean;

  // Thresholds
  SCAN_INTERVAL_SECONDS: number;
  MAX_CONCURRENT_ANALYSES: number;
  SCAM_THRESHOLD: number;
  WARNING_THRESHOLD: number;
  MIN_STAKE_ETH: number;
}

function getEnv(key: string, required: boolean = true, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

function getEnvNumber(key: string, required: boolean = true, defaultValue?: number): number {
  const value = process.env[key];
  if (!value) {
    if (required && defaultValue === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return defaultValue || 0;
  }
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${key}: ${value}`);
  }
  return parsed;
}

function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

export const appConfig: Config = {
  // Blockchain
  BASE_RPC_URL: getEnv('BASE_RPC_URL'),
  BASE_WSS_URL: getEnv('BASE_WSS_URL'),
  BASE_RPC_BACKUP: getEnv('BASE_RPC_BACKUP', false, 'https://mainnet.base.org'),
  BASESCAN_API_KEY: getEnv('BASESCAN_API_KEY'),
  CHAIN_ID: getEnvNumber('CHAIN_ID', false, 8453),

  // Agent Wallet
  AGENT_PRIVATE_KEY: getEnv('AGENT_PRIVATE_KEY'),
  AGENT_ADDRESS: getEnv('AGENT_ADDRESS'),

  // Smart Contracts
  CERTIFICATION_CONTRACT_ADDRESS: getEnv('CERTIFICATION_CONTRACT_ADDRESS', false),

  // Anthropic
  ANTHROPIC_API_KEY: getEnv('ANTHROPIC_API_KEY'),
  CLAUDE_MODEL: getEnv('CLAUDE_MODEL', false, 'claude-opus-4-5-20251101'),
  CLAUDE_MAX_TOKENS: getEnvNumber('CLAUDE_MAX_TOKENS', false, 16000),
  CLAUDE_TEMPERATURE: getEnvNumber('CLAUDE_TEMPERATURE', false, 0.2),

  // Twitter
  TWITTER_API_KEY: getEnv('TWITTER_API_KEY'),
  TWITTER_API_SECRET: getEnv('TWITTER_API_SECRET'),
  TWITTER_ACCESS_TOKEN: getEnv('TWITTER_ACCESS_TOKEN'),
  TWITTER_ACCESS_SECRET: getEnv('TWITTER_ACCESS_SECRET'),
  TWITTER_BEARER_TOKEN: getEnv('TWITTER_BEARER_TOKEN', false),

  // Farcaster
  NEYNAR_API_KEY: getEnv('NEYNAR_API_KEY'),
  FARCASTER_SIGNER_UUID: getEnv('FARCASTER_SIGNER_UUID'),
  FARCASTER_FID: getEnv('FARCASTER_FID', false),

  // IPFS
  PINATA_API_KEY: getEnv('PINATA_API_KEY'),
  PINATA_SECRET_KEY: getEnv('PINATA_SECRET_KEY'),
  PINATA_JWT: getEnv('PINATA_JWT', false),

  // EAS
  EAS_CONTRACT_ADDRESS: getEnv('EAS_CONTRACT_ADDRESS', false, '0x4200000000000000000000000000000000000021'),
  EAS_SCHEMA_UID: getEnv('EAS_SCHEMA_UID', false),

  // Rate Limiting
  TWITTER_MAX_POSTS_PER_HOUR: getEnvNumber('TWITTER_MAX_POSTS_PER_HOUR', false, 12),
  FARCASTER_MAX_POSTS_PER_HOUR: getEnvNumber('FARCASTER_MAX_POSTS_PER_HOUR', false, 15),
  MIN_POST_INTERVAL_SECONDS: getEnvNumber('MIN_POST_INTERVAL_SECONDS', false, 10),
  MAX_POST_INTERVAL_SECONDS: getEnvNumber('MAX_POST_INTERVAL_SECONDS', false, 600),

  // Redis
  REDIS_URL: getEnv('REDIS_URL', false, 'redis://localhost:6379'),
  REDIS_PASSWORD: getEnv('REDIS_PASSWORD', false),

  // Database
  SQLITE_DB_PATH: getEnv('SQLITE_DB_PATH', false, './data/baseguardian.db'),

  // Monitoring
  HEALTH_CHECK_PORT: getEnvNumber('HEALTH_CHECK_PORT', false, 3000),
  LOG_LEVEL: getEnv('LOG_LEVEL', false, 'info'),

  // Feature Flags
  ENABLE_CERTIFICATIONS: getEnvBoolean('ENABLE_CERTIFICATIONS', true),
  ENABLE_TWITTER: getEnvBoolean('ENABLE_TWITTER', true),
  ENABLE_FARCASTER: getEnvBoolean('ENABLE_FARCASTER', true),
  ENABLE_AUTO_STAKE: getEnvBoolean('ENABLE_AUTO_STAKE', true),

  // Thresholds
  SCAN_INTERVAL_SECONDS: getEnvNumber('SCAN_INTERVAL_SECONDS', false, 30),
  MAX_CONCURRENT_ANALYSES: getEnvNumber('MAX_CONCURRENT_ANALYSES', false, 5),
  SCAM_THRESHOLD: getEnvNumber('SCAM_THRESHOLD', false, 70),
  WARNING_THRESHOLD: getEnvNumber('WARNING_THRESHOLD', false, 40),
  MIN_STAKE_ETH: getEnvNumber('MIN_STAKE_ETH', false, 0.000001),
};

// Validate critical configuration
export function validateConfig(): void {
  const errors: string[] = [];

  // Check private key format
  if (!appConfig.AGENT_PRIVATE_KEY.startsWith('0x') || appConfig.AGENT_PRIVATE_KEY.length !== 66) {
    errors.push('AGENT_PRIVATE_KEY must be a valid hex string starting with 0x (66 characters total)');
  }

  // Check addresses format
  if (!appConfig.AGENT_ADDRESS.startsWith('0x') || appConfig.AGENT_ADDRESS.length !== 42) {
    errors.push('AGENT_ADDRESS must be a valid Ethereum address');
  }

  // Check thresholds
  if (appConfig.SCAM_THRESHOLD <= appConfig.WARNING_THRESHOLD) {
    errors.push('SCAM_THRESHOLD must be greater than WARNING_THRESHOLD');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

export default appConfig;
