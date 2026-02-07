/**
 * Claude AI Contract Analyzer
 * Uses Anthropic Claude to analyze smart contracts for security threats
 */

import Anthropic from '@anthropic-ai/sdk';
import { appConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export interface AnalysisResult {
  risk_score: number; // 0-100 (higher is safer)
  classification: 'SAFE' | 'SUSPICIOUS' | 'SCAM';
  threats: string[];
  explanation: string;
  confidence: number; // 0-100
  patterns?: {
    honeypot?: boolean;
    rugpull?: boolean;
    suspicious_permissions?: boolean;
    is_clone?: boolean;
  };
}

export class ClaudeAnalyzer {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: appConfig.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Analyze contract source code or bytecode
   */
  async analyzeContract(
    contractAddress: string,
    sourceCode?: string,
    bytecode?: string,
    metadata?: {
      deployer?: string;
      blockNumber?: number;
      timestamp?: number;
    }
  ): Promise<AnalysisResult> {
    try {
      logger.info('Starting Claude AI analysis', { contractAddress });

      const prompt = this.buildAnalysisPrompt(
        contractAddress,
        sourceCode,
        bytecode,
        metadata
      );

      const response = await this.client.messages.create({
        model: appConfig.CLAUDE_MODEL,
        max_tokens: appConfig.CLAUDE_MAX_TOKENS,
        temperature: appConfig.CLAUDE_TEMPERATURE,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text from response
      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const analysisText = textContent.text;

      // Parse JSON response
      const analysis = this.parseAnalysisResponse(analysisText);

      logger.info('Claude analysis complete', {
        contractAddress,
        classification: analysis.classification,
        riskScore: analysis.risk_score,
      });

      return analysis;
    } catch (error: any) {
      logger.error('Claude analysis failed', {
        contractAddress,
        error: error.message,
      });

      // Return conservative fallback
      return {
        risk_score: 50,
        classification: 'SUSPICIOUS',
        threats: ['Analysis failed - manual review required'],
        explanation: `Failed to analyze contract: ${error.message}`,
        confidence: 0,
      };
    }
  }

  /**
   * Build analysis prompt for Claude
   */
  private buildAnalysisPrompt(
    contractAddress: string,
    sourceCode?: string,
    bytecode?: string,
    metadata?: any
  ): string {
    const hasSource = sourceCode && sourceCode.length > 0;

    return `You are BaseGuardian, an expert smart contract security auditor analyzing contracts on Base Mainnet.

**Contract Information:**
- Address: ${contractAddress}
- Deployer: ${metadata?.deployer || 'Unknown'}
- Block: ${metadata?.blockNumber || 'Unknown'}
- Timestamp: ${metadata?.timestamp ? new Date(metadata.timestamp * 1000).toISOString() : 'Unknown'}
- Verified: ${hasSource ? 'Yes' : 'No'}

${hasSource ? `**Source Code:**
\`\`\`solidity
${sourceCode!.substring(0, 15000)}${sourceCode!.length > 15000 ? '\n... (truncated)' : ''}
\`\`\`` : `**Bytecode:**
${bytecode?.substring(0, 2000)}... (${bytecode?.length} bytes)`}

**Analysis Task:**
Analyze this smart contract for security threats. Focus on:

1. **HONEYPOT PATTERNS**:
   - Can users buy but not sell?
   - Hidden fees on sells only?
   - Blacklist functions preventing selling?
   - Unusual transfer restrictions?

2. **RUG PULL INDICATORS**:
   - Can owner mint unlimited tokens?
   - Can owner drain liquidity?
   - Ownership renounced? (if not, risky)
   - Timelock on critical functions?
   - Proxy with upgradeable logic?

3. **SUSPICIOUS PERMISSIONS**:
   - Can owner pause transfers indefinitely?
   - Can owner modify balances?
   - Can owner change fees retroactively?
   - Hidden admin roles?

4. **TOKEN CLONE DETECTION**:
   - Copying known token (USDC, WETH, etc)?
   - Misleading name/symbol?

5. **GENERAL RED FLAGS**:
   - Overly complex code without reason?
   - Obfuscated logic?
   - Unusual gas patterns?

**IMPORTANT**: Be strict but fair. False positives hurt users. False negatives are dangerous.

**Response Format (JSON only):**
\`\`\`json
{
  "risk_score": <0-100, where 100 is safest>,
  "classification": "<SAFE|SUSPICIOUS|SCAM>",
  "threats": ["<threat 1>", "<threat 2>"],
  "explanation": "<brief explanation>",
  "confidence": <0-100>,
  "patterns": {
    "honeypot": <boolean>,
    "rugpull": <boolean>,
    "suspicious_permissions": <boolean>,
    "is_clone": <boolean>
  }
}
\`\`\`

Respond ONLY with valid JSON. No other text.`;
  }

  /**
   * Parse Claude's JSON response
   */
  private parseAnalysisResponse(responseText: string): AnalysisResult {
    try {
      // Extract JSON from response (may be wrapped in markdown)
      const jsonMatch = responseText.match(/\`\`\`json\s*([\s\S]*?)\s*\`\`\`/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;

      const parsed = JSON.parse(jsonText.trim());

      // Validate and normalize
      return {
        risk_score: this.clamp(parsed.risk_score || 50, 0, 100),
        classification: this.normalizeClassification(parsed.classification),
        threats: Array.isArray(parsed.threats) ? parsed.threats : [],
        explanation: parsed.explanation || 'No explanation provided',
        confidence: this.clamp(parsed.confidence || 50, 0, 100),
        patterns: {
          honeypot: Boolean(parsed.patterns?.honeypot),
          rugpull: Boolean(parsed.patterns?.rugpull),
          suspicious_permissions: Boolean(parsed.patterns?.suspicious_permissions),
          is_clone: Boolean(parsed.patterns?.is_clone),
        },
      };
    } catch (error: any) {
      logger.error('Failed to parse Claude response', {
        error: error.message,
        response: responseText.substring(0, 500),
      });

      // Return conservative fallback
      return {
        risk_score: 50,
        classification: 'SUSPICIOUS',
        threats: ['Failed to parse AI analysis'],
        explanation: 'Manual review required',
        confidence: 0,
      };
    }
  }

  /**
   * Normalize classification
   */
  private normalizeClassification(classification: string): 'SAFE' | 'SUSPICIOUS' | 'SCAM' {
    const normalized = classification?.toUpperCase();
    if (normalized === 'SAFE' || normalized === 'SUSPICIOUS' || normalized === 'SCAM') {
      return normalized as 'SAFE' | 'SUSPICIOUS' | 'SCAM';
    }
    return 'SUSPICIOUS'; // Default to SUSPICIOUS if invalid
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}

// Singleton instance
let analyzerInstance: ClaudeAnalyzer | null = null;

export function getClaudeAnalyzer(): ClaudeAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new ClaudeAnalyzer();
  }
  return analyzerInstance;
}

export default ClaudeAnalyzer;
