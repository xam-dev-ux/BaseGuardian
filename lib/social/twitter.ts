/**
 * Twitter API Client for BaseGuardian
 * Handles posting security alerts and certifications
 */

import { TwitterApi } from 'twitter-api-v2';
import { appConfig } from '../utils/config.js';
import { logger, logSocialPost } from '../utils/logger.js';

export interface TweetContent {
  contractAddress: string;
  type: 'scam_alert' | 'certification' | 'stats';
  riskScore?: number;
  threats?: string[];
  ipfsHash?: string;
  txHash?: string;
}

export class TwitterClient {
  private client: TwitterApi;
  private lastPostTime: number = 0;
  private postsThisHour: number = 0;
  private hourStartTime: number = Date.now();

  constructor() {
    this.client = new TwitterApi({
      appKey: appConfig.TWITTER_API_KEY,
      appSecret: appConfig.TWITTER_API_SECRET,
      accessToken: appConfig.TWITTER_ACCESS_TOKEN,
      accessSecret: appConfig.TWITTER_ACCESS_SECRET,
    });
  }

  /**
   * Post scam alert to Twitter
   */
  async postScamAlert(content: TweetContent): Promise<string | null> {
    const tweet = this.formatScamAlert(content);
    return await this.postTweet(tweet, 'scam_alert');
  }

  /**
   * Post certification announcement to Twitter
   */
  async postCertification(content: TweetContent): Promise<string | null> {
    const tweet = this.formatCertification(content);
    return await this.postTweet(tweet, 'certification');
  }

  /**
   * Post daily stats to Twitter
   */
  async postDailyStats(stats: {
    contracts_scanned: number;
    scams_detected: number;
    safe_certified: number;
    warnings_issued: number;
  }): Promise<string | null> {
    const tweet = this.formatStats(stats);
    return await this.postTweet(tweet, 'stats');
  }

  /**
   * Post tweet with rate limiting
   */
  private async postTweet(content: string, type: string): Promise<string | null> {
    try {
      // Check rate limits
      if (!this.checkRateLimit()) {
        logger.warn('Twitter rate limit exceeded', {
          postsThisHour: this.postsThisHour,
          limit: appConfig.TWITTER_MAX_POSTS_PER_HOUR,
        });
        return null;
      }

      // Enforce minimum interval between posts
      const now = Date.now();
      const timeSinceLastPost = now - this.lastPostTime;
      const minInterval = appConfig.MIN_POST_INTERVAL_SECONDS * 1000;

      if (timeSinceLastPost < minInterval) {
        const waitTime = minInterval - timeSinceLastPost;
        logger.info('Waiting before posting', { waitTime });
        await this.sleep(waitTime);
      }

      // Post tweet
      logger.info('Posting to Twitter', { type, length: content.length });
      const response = await this.client.v2.tweet(content);

      this.lastPostTime = Date.now();
      this.postsThisHour++;

      logSocialPost('twitter', type, true);

      logger.info('Tweet posted successfully', {
        tweetId: response.data.id,
        type,
      });

      return response.data.id;
    } catch (error: any) {
      logger.error('Failed to post tweet', {
        type,
        error: error.message,
        code: error.code,
      });

      logSocialPost('twitter', type, false);

      // Handle specific error codes
      if (error.code === 429) {
        const resetTime = error.rateLimit?.reset || Date.now() + 15 * 60 * 1000;
        logger.warn('Twitter rate limit hit', { resetTime });
      } else if (error.code === 403) {
        logger.error('Twitter 403 Forbidden - Check app permissions', {
          hint: 'Go to developer.twitter.com and ensure your app has "Read and Write" permissions',
          action: 'Regenerate access tokens after changing permissions',
        });
      } else if (error.code === 401) {
        logger.error('Twitter 401 Unauthorized - Invalid credentials', {
          hint: 'Check TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET in .env',
        });
      }

      return null;
    }
  }

  /**
   * Format scam alert tweet
   */
  private formatScamAlert(content: TweetContent): string {
    const address = content.contractAddress;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const riskScore = content.riskScore || 0;
    const threats = content.threats || [];

    // Twitter has 280 char limit - keep it short
    const threat = threats[0] || 'Multiple security issues detected';
    const severity = riskScore < 40 ? 'CRITICAL' : 'HIGH';

    return `🚨 ${severity} SCAM ALERT

Contract: ${shortAddress}
Risk: ${riskScore}/100
Issue: ${threat}

⛔ DO NOT INTERACT

https://basescan.org/address/${address}

#BaseMainnet #ScamAlert`;
  }

  /**
   * Format certification tweet
   */
  private formatCertification(content: TweetContent): string {
    const address = content.contractAddress;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const riskScore = content.riskScore || 0;
    const txHash = content.txHash || '';

    return `✅ CONTRACT CERTIFIED

Contract: ${shortAddress}
Risk: ${riskScore}/100 (LOW)

No major threats detected
DYOR before using!

Proof: https://basescan.org/tx/${txHash}

#BaseCertified #BaseMainnet`;
  }

  /**
   * Format daily stats tweet
   */
  private formatStats(stats: any): string {
    return `📊 BaseGuardian Daily Report

Contracts scanned: ${stats.contracts_scanned}
Scams detected: ${stats.scams_detected}
Safe contracts certified: ${stats.safe_certified}
Warnings issued: ${stats.warnings_issued}

Keeping Base safe, one contract at a time 🛡️

#BaseMainnet #Web3Security`;
  }

  /**
   * Check if within rate limits
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const hourElapsed = now - this.hourStartTime;

    // Reset counter if hour has passed
    if (hourElapsed >= 60 * 60 * 1000) {
      this.postsThisHour = 0;
      this.hourStartTime = now;
    }

    return this.postsThisHour < appConfig.TWITTER_MAX_POSTS_PER_HOUR;
  }

  /**
   * Test Twitter connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const me = await this.client.v2.me();
      logger.info('Twitter connection successful', {
        username: me.data.username,
        id: me.data.id,
      });
      return true;
    } catch (error: any) {
      logger.error('Twitter connection failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): {
    postsThisHour: number;
    maxPerHour: number;
    remaining: number;
  } {
    return {
      postsThisHour: this.postsThisHour,
      maxPerHour: appConfig.TWITTER_MAX_POSTS_PER_HOUR,
      remaining: appConfig.TWITTER_MAX_POSTS_PER_HOUR - this.postsThisHour,
    };
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let twitterInstance: TwitterClient | null = null;

export function getTwitterClient(): TwitterClient {
  if (!twitterInstance) {
    twitterInstance = new TwitterClient();
  }
  return twitterInstance;
}

export default TwitterClient;
