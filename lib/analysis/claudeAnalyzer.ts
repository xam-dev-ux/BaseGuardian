/**
 * Claude AI Contract Analyzer
 * Uses Anthropic Claude to analyze smart contracts for security threats
 *
 * SCORING SYSTEM:
 * - safety_score: 0-100 where 100 = SAFEST, 0 = MOST DANGEROUS
 * - classification: SAFE (score >= 80), SUSPICIOUS (40-79), SCAM (< 40)
 */

import Anthropic from '@anthropic-ai/sdk';
import { appConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export interface AnalysisResult {
  safety_score: number; // 0-100 (100 = safest, 0 = most dangerous)
  classification: 'SAFE' | 'SUSPICIOUS' | 'SCAM';
  threats: string[];
  explanation: string;
  confidence: number; // 0-100
  patterns: {
    honeypot: boolean;
    rugpull: boolean;
    reentrancy: boolean;
    selfdestruct: boolean;
    delegatecall: boolean;
    flash_loan_vulnerable: boolean;
    suspicious_permissions: boolean;
    is_clone: boolean;
    proxy_upgradeable: boolean;
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

      // Cross-validate and correct any inconsistencies
      const validatedAnalysis = this.validateAnalysis(analysis);

      logger.info('Claude analysis complete', {
        contractAddress,
        classification: validatedAnalysis.classification,
        safetyScore: validatedAnalysis.safety_score,
      });

      return validatedAnalysis;
    } catch (error: any) {
      logger.error('Claude analysis failed', {
        contractAddress,
        error: error.message,
      });

      // Return conservative fallback
      return {
        safety_score: 50,
        classification: 'SUSPICIOUS',
        threats: ['Analysis failed - manual review required'],
        explanation: `Failed to analyze contract: ${error.message}`,
        confidence: 0,
        patterns: {
          honeypot: false,
          rugpull: false,
          reentrancy: false,
          selfdestruct: false,
          delegatecall: false,
          flash_loan_vulnerable: false,
          suspicious_permissions: false,
          is_clone: false,
          proxy_upgradeable: false,
        },
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
    // Increased limits: 50KB source, 8KB bytecode
    const maxSourceLength = 50000;
    const maxBytecodeLength = 8000;

    return `You are BaseGuardian, an expert smart contract security auditor analyzing contracts on Base Mainnet.

**Contract Information:**
- Address: ${contractAddress}
- Deployer: ${metadata?.deployer || 'Unknown'}
- Block: ${metadata?.blockNumber || 'Unknown'}
- Timestamp: ${metadata?.timestamp ? new Date(metadata.timestamp * 1000).toISOString() : 'Unknown'}
- Verified: ${hasSource ? 'Yes' : 'No'}

${hasSource ? `**Source Code:**
\`\`\`solidity
${sourceCode!.substring(0, maxSourceLength)}${sourceCode!.length > maxSourceLength ? '\n... (truncated)' : ''}
\`\`\`` : `**Bytecode:**
${bytecode?.substring(0, maxBytecodeLength)}... (${bytecode?.length} bytes)`}

**Analysis Task:**
Analyze this smart contract for security threats. Provide a SAFETY SCORE where 100 = COMPLETELY SAFE, 0 = EXTREMELY DANGEROUS.

Focus on these vulnerability categories:

1. **HONEYPOT PATTERNS** (Critical - can trap user funds):
   - Can users buy but not sell?
   - Hidden fees on sells only?
   - Blacklist functions preventing selling?
   - Unusual transfer restrictions?
   - Max transaction limits that prevent selling?

2. **RUG PULL INDICATORS** (Critical - can steal all funds):
   - Can owner mint unlimited tokens?
   - Can owner drain liquidity pool?
   - Ownership NOT renounced? (risky if active)
   - No timelock on critical functions?
   - Proxy with upgradeable logic that could be malicious?

3. **REENTRANCY VULNERABILITIES** (High - can drain funds):
   - External calls before state updates?
   - Missing reentrancy guards on payable functions?
   - Callback patterns without protection?

4. **DANGEROUS OPCODES**:
   - SELFDESTRUCT: Can destroy contract and steal ETH?
   - DELEGATECALL: Can execute arbitrary code?
   - CREATE2: Can deploy malicious contracts at predictable addresses?

5. **FLASH LOAN VULNERABILITIES**:
   - Price oracle manipulation possible?
   - Single-block arbitrage vulnerabilities?
   - Vulnerable to sandwich attacks?

6. **SUSPICIOUS PERMISSIONS**:
   - Can owner pause transfers indefinitely?
   - Can owner modify balances directly?
   - Can owner change fees retroactively?
   - Hidden admin roles or backdoors?
   - Whitelists that exclude regular users?

7. **TOKEN CLONE DETECTION**:
   - Copying known token name/symbol (USDC, WETH, etc)?
   - Misleading token metadata?
   - Impersonating legitimate projects?

8. **MEV/FRONT-RUNNING RISKS**:
   - Vulnerable to front-running attacks?
   - No slippage protection?
   - Predictable transaction outcomes?

**SCORING GUIDELINES:**
- safety_score 80-100: SAFE - No significant issues, standard patterns
- safety_score 40-79: SUSPICIOUS - Some concerns, proceed with caution
- safety_score 0-39: SCAM - Confirmed malicious patterns or critical vulnerabilities

**IMPORTANT**:
- Be strict but fair. False positives hurt users. False negatives are dangerous.
- The classification MUST match the safety_score ranges above.
- Unverified contracts (bytecode only) should start with lower confidence.

**Response Format (JSON only):**
\`\`\`json
{
  "safety_score": <0-100, where 100 is safest>,
  "classification": "<SAFE|SUSPICIOUS|SCAM>",
  "threats": ["<specific threat 1>", "<specific threat 2>"],
  "explanation": "<brief explanation of findings>",
  "confidence": <0-100>,
  "patterns": {
    "honeypot": <boolean>,
    "rugpull": <boolean>,
    "reentrancy": <boolean>,
    "selfdestruct": <boolean>,
    "delegatecall": <boolean>,
    "flash_loan_vulnerable": <boolean>,
    "suspicious_permissions": <boolean>,
    "is_clone": <boolean>,
    "proxy_upgradeable": <boolean>
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

      // Handle both old (risk_score) and new (safety_score) formats
      const safetyScore = parsed.safety_score ?? parsed.risk_score ?? 50;

      // Validate and normalize
      return {
        safety_score: this.clamp(safetyScore, 0, 100),
        classification: this.normalizeClassification(parsed.classification),
        threats: Array.isArray(parsed.threats) ? parsed.threats : [],
        explanation: parsed.explanation || 'No explanation provided',
        confidence: this.clamp(parsed.confidence || 50, 0, 100),
        patterns: {
          honeypot: Boolean(parsed.patterns?.honeypot),
          rugpull: Boolean(parsed.patterns?.rugpull),
          reentrancy: Boolean(parsed.patterns?.reentrancy),
          selfdestruct: Boolean(parsed.patterns?.selfdestruct),
          delegatecall: Boolean(parsed.patterns?.delegatecall),
          flash_loan_vulnerable: Boolean(parsed.patterns?.flash_loan_vulnerable),
          suspicious_permissions: Boolean(parsed.patterns?.suspicious_permissions),
          is_clone: Boolean(parsed.patterns?.is_clone),
          proxy_upgradeable: Boolean(parsed.patterns?.proxy_upgradeable),
        },
      };
    } catch (error: any) {
      logger.error('Failed to parse Claude response', {
        error: error.message,
        response: responseText.substring(0, 500),
      });

      // Return conservative fallback
      return {
        safety_score: 50,
        classification: 'SUSPICIOUS',
        threats: ['Failed to parse AI analysis'],
        explanation: 'Manual review required',
        confidence: 0,
        patterns: {
          honeypot: false,
          rugpull: false,
          reentrancy: false,
          selfdestruct: false,
          delegatecall: false,
          flash_loan_vulnerable: false,
          suspicious_permissions: false,
          is_clone: false,
          proxy_upgradeable: false,
        },
      };
    }
  }

  /**
   * Cross-validate analysis to ensure classification matches safety_score
   * Fixes inconsistencies between score and classification
   */
  private validateAnalysis(analysis: AnalysisResult): AnalysisResult {
    const { safety_score, classification, patterns } = analysis;

    // Check for critical patterns that should lower classification
    const hasCriticalPatterns = patterns.honeypot || patterns.rugpull || patterns.selfdestruct;
    const hasDangerousPatterns = patterns.reentrancy || patterns.delegatecall || patterns.flash_loan_vulnerable;

    let correctedClassification = classification;
    let correctedScore = safety_score;

    // Cross-validate: score should match classification ranges
    // SAFE: 80-100, SUSPICIOUS: 40-79, SCAM: 0-39
    if (safety_score >= 80 && classification !== 'SAFE') {
      // High score but not marked SAFE - check if patterns justify lower classification
      if (hasCriticalPatterns) {
        correctedScore = Math.min(safety_score, 35); // Force SCAM range
        correctedClassification = 'SCAM';
      } else if (hasDangerousPatterns) {
        correctedScore = Math.min(safety_score, 70); // Force SUSPICIOUS range
        correctedClassification = 'SUSPICIOUS';
      } else {
        correctedClassification = 'SAFE';
      }
    } else if (safety_score >= 40 && safety_score < 80 && classification !== 'SUSPICIOUS') {
      // Mid-range score but wrong classification
      if (classification === 'SAFE' && (hasCriticalPatterns || hasDangerousPatterns)) {
        correctedClassification = 'SUSPICIOUS';
      } else if (classification === 'SCAM' && !hasCriticalPatterns) {
        correctedClassification = 'SUSPICIOUS';
      } else {
        correctedClassification = 'SUSPICIOUS';
      }
    } else if (safety_score < 40 && classification !== 'SCAM') {
      // Low score should always be SCAM
      correctedClassification = 'SCAM';
    }

    // If critical patterns detected but score is high, correct it
    if (hasCriticalPatterns && correctedScore > 40) {
      correctedScore = Math.min(correctedScore, 35);
      correctedClassification = 'SCAM';
      logger.warn('Corrected classification due to critical patterns', {
        original: { safety_score, classification },
        corrected: { safety_score: correctedScore, classification: correctedClassification },
      });
    }

    return {
      ...analysis,
      safety_score: correctedScore,
      classification: correctedClassification,
    };
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
