#!/usr/bin/env node
/**
 * Export database data for BaseGuardian Console
 * Run: node scripts/export-console-data.mjs
 * Output: Copies data.json to baseguardian-console/public/data.json
 */

import Database from 'better-sqlite3';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.SQLITE_DB_PATH || join(__dirname, '../data/baseguardian.db');
const CONSOLE_PATH = join(__dirname, '../../baseguardian-console/public/data.json');

console.log('📦 Exporting BaseGuardian data for console...');
console.log(`   Database: ${DB_PATH}`);
console.log(`   Output: ${CONSOLE_PATH}`);

if (!existsSync(DB_PATH)) {
  console.error('❌ Database not found:', DB_PATH);
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

// Get daily stats
const stats = db.prepare(`
  SELECT
    COUNT(DISTINCT d.contract_address) as contracts_scanned,
    SUM(CASE WHEN a.classification = 'SCAM' THEN 1 ELSE 0 END) as scams_detected,
    SUM(CASE WHEN a.classification = 'SAFE' THEN 1 ELSE 0 END) as safe_certified,
    SUM(CASE WHEN a.classification = 'SUSPICIOUS' THEN 1 ELSE 0 END) as warnings_issued
  FROM deployments d
  LEFT JOIN analyses a ON d.contract_address = a.contract_address
`).get();

// Get all analyses
const analyses = db.prepare(`
  SELECT * FROM analyses ORDER BY id DESC LIMIT 200
`).all().map(a => ({
  ...a,
  threats: JSON.parse(a.threats || '[]'),
  is_verified: Boolean(a.is_verified),
}));

// Get certifications with analysis data
const certifications = db.prepare(`
  SELECT c.*, a.risk_score, a.classification, a.explanation, a.confidence, a.threats, a.is_verified
  FROM certifications c
  LEFT JOIN analyses a ON c.contract_address = a.contract_address
  ORDER BY c.id DESC
  LIMIT 50
`).all().map(c => ({
  ...c,
  threats: JSON.parse(c.threats || '[]'),
  is_verified: Boolean(c.is_verified),
  stake_eth: (Number(c.stake_amount) / 1e18).toFixed(6),
  basescan_tx: `https://basescan.org/tx/${c.tx_hash}`,
  ipfs_url: `https://gateway.pinata.cloud/ipfs/${c.ipfs_hash}`,
}));

// Get SCAM alerts
const scams = db.prepare(`
  SELECT * FROM analyses
  WHERE classification = 'SCAM'
  ORDER BY id DESC
  LIMIT 50
`).all().map(s => ({
  ...s,
  threats: JSON.parse(s.threats || '[]'),
  is_verified: Boolean(s.is_verified),
}));

db.close();

// Build export object
const exportData = {
  exportedAt: new Date().toISOString(),
  stats: {
    contracts_scanned: stats.contracts_scanned || 0,
    scams_detected: stats.scams_detected || 0,
    safe_certified: stats.safe_certified || 0,
    warnings_issued: stats.warnings_issued || 0,
  },
  analyses,
  certifications,
  scams,
};

// Write to console public folder
writeFileSync(CONSOLE_PATH, JSON.stringify(exportData, null, 2));

console.log('');
console.log('✅ Export complete!');
console.log(`   Stats: ${stats.contracts_scanned} contracts, ${stats.scams_detected} scams, ${certifications.length} certifications`);
console.log(`   Analyses: ${analyses.length}`);
console.log(`   Certifications: ${certifications.length}`);
console.log(`   SCAM Alerts: ${scams.length}`);
console.log('');
console.log('📁 File saved to:', CONSOLE_PATH);
console.log('   Run "cd ../baseguardian-console && vercel" to deploy');
