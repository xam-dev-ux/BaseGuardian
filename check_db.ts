/**
 * Check SQLite database status
 */

import { getDatabase } from './lib/storage/db.js';

const db = getDatabase();

console.log('📊 BaseGuardian Database Status\n');
console.log('='.repeat(50));

// Get daily stats
const stats = db.getDailyStats();
console.log('\n📈 Today\'s Statistics:');
console.log(`  Contracts scanned: ${stats.contracts_scanned || 0}`);
console.log(`  Scams detected: ${stats.scams_detected || 0}`);
console.log(`  Safe certified: ${stats.safe_certified || 0}`);
console.log(`  Warnings issued: ${stats.warnings_issued || 0}`);

// Get all certifications
const certifications = db.getAllCertifications();
console.log(`\n🛡️ Total Certifications: ${certifications.length}`);
if (certifications.length > 0) {
  certifications.slice(0, 5).forEach((cert, i) => {
    console.log(`  ${i + 1}. ${cert.contract_address.substring(0, 10)}... (${cert.ipfs_hash.substring(0, 10)}...)`);
  });
}

// Get reputation metrics
const reputation = db.getReputationMetrics();
console.log('\n⭐ Reputation Metrics:');
console.log(`  Total certifications: ${reputation.total_certifications || 0}`);
console.log(`  Total challenges: ${reputation.total_challenges || 0}`);
console.log(`  Total slashes: ${reputation.total_slashes || 0}`);
console.log(`  Total rewards: ${reputation.total_rewards || 0}`);

// Get pending tasks
const pendingAnalyses = db.getPendingAnalysisContracts(5);
console.log(`\n🔍 Pending Analysis: ${pendingAnalyses.length} contracts`);

const safeForCert = db.getSafeContractsPendingCertification(5);
console.log(`✅ Safe (pending cert): ${safeForCert.length} contracts`);

const scamsForAlert = db.getScamsPendingAlert(5);
console.log(`🚨 Scams (pending alert): ${scamsForAlert.length} contracts`);

const pendingPosts = db.getPendingPosts(undefined, 10);
console.log(`📝 Pending posts: ${pendingPosts.length} posts`);

console.log('\n' + '='.repeat(50));
console.log('✅ Database is working correctly!\n');
