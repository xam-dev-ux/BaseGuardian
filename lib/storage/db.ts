/**
 * SQLite Database Manager for BaseGuardian
 * Manages all persistent storage for contract detections, analyses, certifications, and social posts
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface Deployment {
  id?: number;
  contract_address: string;
  deployer_address: string;
  tx_hash: string;
  block_number: number;
  timestamp: number;
  bytecode_hash?: string;
  detected_at?: string;
}

export interface Analysis {
  id?: number;
  contract_address: string;
  source_code?: string;
  is_verified: boolean;
  risk_score: number;
  classification: 'SAFE' | 'SUSPICIOUS' | 'SCAM';
  threats: string; // JSON array
  explanation: string;
  confidence: number;
  analyzed_at?: string;
}

export interface Certification {
  id?: number;
  contract_address: string;
  certification_id?: number; // Onchain ID
  ipfs_hash: string;
  stake_amount: string; // Wei as string
  tx_hash: string;
  eas_attestation_uid?: string;
  created_at?: string;
}

export interface SocialPost {
  id?: number;
  contract_address?: string;
  platform: 'twitter' | 'farcaster';
  post_type: 'scam_alert' | 'certification' | 'update' | 'stats';
  content: string;
  post_id?: string; // Platform-specific ID
  posted_at?: string;
  status: 'pending' | 'posted' | 'failed';
}

export interface ReputationEvent {
  id?: number;
  event_type: 'certification' | 'challenge' | 'slash' | 'reward';
  contract_address?: string;
  amount?: string; // Wei as string
  details: string; // JSON
  created_at?: string;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string = process.env.SQLITE_DB_PATH || './data/baseguardian.db') {
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // Initialize database
    this.db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    // Initialize schema
    this.initSchema();
  }

  private initSchema(): void {
    const schema = `
      -- Contract deployments detected
      CREATE TABLE IF NOT EXISTS deployments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_address TEXT UNIQUE NOT NULL,
        deployer_address TEXT NOT NULL,
        tx_hash TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        bytecode_hash TEXT,
        detected_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Contract analyses
      CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_address TEXT NOT NULL,
        source_code TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        risk_score INTEGER NOT NULL,
        classification TEXT NOT NULL CHECK(classification IN ('SAFE', 'SUSPICIOUS', 'SCAM')),
        threats TEXT NOT NULL, -- JSON array
        explanation TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_address) REFERENCES deployments(contract_address)
      );

      -- Certifications issued
      CREATE TABLE IF NOT EXISTS certifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_address TEXT NOT NULL UNIQUE,
        certification_id INTEGER, -- Onchain ID
        ipfs_hash TEXT NOT NULL,
        stake_amount TEXT NOT NULL, -- Wei as string
        tx_hash TEXT NOT NULL,
        eas_attestation_uid TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_address) REFERENCES deployments(contract_address)
      );

      -- Social media posts
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_address TEXT,
        platform TEXT NOT NULL CHECK(platform IN ('twitter', 'farcaster')),
        post_type TEXT NOT NULL CHECK(post_type IN ('scam_alert', 'certification', 'update', 'stats')),
        content TEXT NOT NULL,
        post_id TEXT, -- Platform-specific ID
        posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'posted', 'failed'))
      );

      -- Reputation events
      CREATE TABLE IF NOT EXISTS reputation_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL CHECK(event_type IN ('certification', 'challenge', 'slash', 'reward')),
        contract_address TEXT,
        amount TEXT, -- Wei as string
        details TEXT NOT NULL, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Processing queue for async tasks
      CREATE TABLE IF NOT EXISTS processing_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_type TEXT NOT NULL,
        payload TEXT NOT NULL, -- JSON
        priority INTEGER DEFAULT 5,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_deployments_address ON deployments(contract_address);
      CREATE INDEX IF NOT EXISTS idx_deployments_timestamp ON deployments(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_analyses_classification ON analyses(classification);
      CREATE INDEX IF NOT EXISTS idx_analyses_address ON analyses(contract_address);
      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, posted_at);
      CREATE INDEX IF NOT EXISTS idx_queue_status ON processing_queue(status, priority DESC);
    `;

    // Execute schema
    this.db.exec(schema);
  }

  // ===== Deployments =====

  insertDeployment(deployment: Deployment): number {
    const stmt = this.db.prepare(`
      INSERT INTO deployments (contract_address, deployer_address, tx_hash, block_number, timestamp, bytecode_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      deployment.contract_address,
      deployment.deployer_address,
      deployment.tx_hash,
      deployment.block_number,
      deployment.timestamp,
      deployment.bytecode_hash || null
    );
    return result.lastInsertRowid as number;
  }

  getDeployment(contractAddress: string): Deployment | undefined {
    const stmt = this.db.prepare('SELECT * FROM deployments WHERE contract_address = ?');
    return stmt.get(contractAddress) as Deployment | undefined;
  }

  getPendingAnalysisContracts(limit: number = 10): Deployment[] {
    const stmt = this.db.prepare(`
      SELECT d.* FROM deployments d
      LEFT JOIN analyses a ON d.contract_address = a.contract_address
      WHERE a.id IS NULL
      ORDER BY d.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit) as Deployment[];
  }

  // ===== Analyses =====

  insertAnalysis(analysis: Analysis): number {
    const stmt = this.db.prepare(`
      INSERT INTO analyses (contract_address, source_code, is_verified, risk_score, classification, threats, explanation, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      analysis.contract_address,
      analysis.source_code || null,
      analysis.is_verified ? 1 : 0,
      analysis.risk_score,
      analysis.classification,
      analysis.threats,
      analysis.explanation,
      analysis.confidence
    );
    return result.lastInsertRowid as number;
  }

  getAnalysis(contractAddress: string): Analysis | undefined {
    const stmt = this.db.prepare('SELECT * FROM analyses WHERE contract_address = ? ORDER BY analyzed_at DESC LIMIT 1');
    return stmt.get(contractAddress) as Analysis | undefined;
  }

  getSafeContractsPendingCertification(limit: number = 5): Analysis[] {
    const stmt = this.db.prepare(`
      SELECT a.* FROM analyses a
      LEFT JOIN certifications c ON a.contract_address = c.contract_address
      WHERE a.classification = 'SAFE'
        AND a.risk_score >= 80
        AND a.confidence >= 75
        AND c.id IS NULL
      ORDER BY a.risk_score DESC, a.analyzed_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as Analysis[];
  }

  getScamsPendingAlert(limit: number = 5): Analysis[] {
    const stmt = this.db.prepare(`
      SELECT a.* FROM analyses a
      LEFT JOIN posts p ON a.contract_address = p.contract_address AND p.post_type = 'scam_alert'
      WHERE a.classification = 'SCAM'
        AND p.id IS NULL
      ORDER BY a.risk_score ASC, a.analyzed_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as Analysis[];
  }

  // ===== Certifications =====

  insertCertification(certification: Certification): number {
    const stmt = this.db.prepare(`
      INSERT INTO certifications (contract_address, certification_id, ipfs_hash, stake_amount, tx_hash, eas_attestation_uid)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      certification.contract_address,
      certification.certification_id || null,
      certification.ipfs_hash,
      certification.stake_amount,
      certification.tx_hash,
      certification.eas_attestation_uid || null
    );
    return result.lastInsertRowid as number;
  }

  getCertification(contractAddress: string): Certification | undefined {
    const stmt = this.db.prepare('SELECT * FROM certifications WHERE contract_address = ?');
    return stmt.get(contractAddress) as Certification | undefined;
  }

  getAllCertifications(): Certification[] {
    const stmt = this.db.prepare('SELECT * FROM certifications ORDER BY created_at DESC');
    return stmt.all() as Certification[];
  }

  // ===== Social Posts =====

  insertPost(post: SocialPost): number {
    const stmt = this.db.prepare(`
      INSERT INTO posts (contract_address, platform, post_type, content, post_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      post.contract_address || null,
      post.platform,
      post.post_type,
      post.content,
      post.post_id || null,
      post.status
    );
    return result.lastInsertRowid as number;
  }

  updatePostStatus(id: number, status: 'posted' | 'failed', postId?: string): void {
    const stmt = this.db.prepare('UPDATE posts SET status = ?, post_id = ?, posted_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(status, postId || null, id);
  }

  getPendingPosts(platform?: 'twitter' | 'farcaster', limit: number = 10): SocialPost[] {
    let query = 'SELECT * FROM posts WHERE status = \'pending\'';
    const params: any[] = [];

    if (platform) {
      query += ' AND platform = ?';
      params.push(platform);
    }

    query += ' ORDER BY CASE post_type WHEN \'scam_alert\' THEN 1 WHEN \'certification\' THEN 2 ELSE 3 END, posted_at ASC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as SocialPost[];
  }

  // ===== Reputation Events =====

  insertReputationEvent(event: ReputationEvent): number {
    const stmt = this.db.prepare(`
      INSERT INTO reputation_events (event_type, contract_address, amount, details)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      event.event_type,
      event.contract_address || null,
      event.amount || null,
      event.details
    );
    return result.lastInsertRowid as number;
  }

  getReputationMetrics(): {
    total_certifications: number;
    total_challenges: number;
    total_slashes: number;
    total_rewards: number;
  } {
    const stmt = this.db.prepare(`
      SELECT
        SUM(CASE WHEN event_type = 'certification' THEN 1 ELSE 0 END) as total_certifications,
        SUM(CASE WHEN event_type = 'challenge' THEN 1 ELSE 0 END) as total_challenges,
        SUM(CASE WHEN event_type = 'slash' THEN 1 ELSE 0 END) as total_slashes,
        SUM(CASE WHEN event_type = 'reward' THEN 1 ELSE 0 END) as total_rewards
      FROM reputation_events
    `);
    return stmt.get() as any;
  }

  // ===== Statistics =====

  getDailyStats(date?: string): {
    contracts_scanned: number;
    scams_detected: number;
    safe_certified: number;
    warnings_issued: number;
  } {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const stmt = this.db.prepare(`
      SELECT
        COUNT(DISTINCT d.contract_address) as contracts_scanned,
        SUM(CASE WHEN a.classification = 'SCAM' THEN 1 ELSE 0 END) as scams_detected,
        SUM(CASE WHEN a.classification = 'SAFE' THEN 1 ELSE 0 END) as safe_certified,
        SUM(CASE WHEN a.classification = 'SUSPICIOUS' THEN 1 ELSE 0 END) as warnings_issued
      FROM deployments d
      LEFT JOIN analyses a ON d.contract_address = a.contract_address
      WHERE DATE(d.detected_at) = ?
    `);

    return stmt.get(targetDate) as any;
  }

  // ===== Processing Queue =====

  enqueueTask(taskType: string, payload: any, priority: number = 5): number {
    const stmt = this.db.prepare(`
      INSERT INTO processing_queue (task_type, payload, priority)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(taskType, JSON.stringify(payload), priority);
    return result.lastInsertRowid as number;
  }

  dequeueTask(): any | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM processing_queue
      WHERE status = 'pending' AND attempts < max_attempts
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
    `);
    const task = stmt.get();

    if (task) {
      // Mark as processing
      const updateStmt = this.db.prepare(`
        UPDATE processing_queue
        SET status = 'processing', attempts = attempts + 1
        WHERE id = ?
      `);
      updateStmt.run((task as any).id);
    }

    return task;
  }

  completeTask(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE processing_queue
      SET status = 'completed', processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(id);
  }

  failTask(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE processing_queue
      SET status = 'failed', processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(id);
  }

  // ===== Utility =====

  close(): void {
    this.db.close();
  }

  backup(destPath: string): void {
    this.db.backup(destPath);
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}

export default DatabaseManager;
