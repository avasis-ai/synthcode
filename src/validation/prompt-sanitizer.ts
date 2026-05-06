import { Message, ContentBlock, TextBlock } from "../types/message.js";

export type FindingType = "InjectionAttempt" | "JailbreakAttempt" | "StructuralAnomaly" | "PolicyViolation";

export interface Finding {
  type: FindingType;
  severity: "Low" | "Medium" | "High" | "Critical";
  message: string;
  suggestedFix?: string;
}

export interface PromptSanitizationReport {
  findings: Finding[];
  isClean: boolean;
  sanitizedContent: string;
}

export class PromptSanitizer {
  private static readonly INJECTION_PATTERNS: RegExp[] = [
    /ignore previous instructions/i,
    /act as if you are/i,
    /system prompt ends here/i,
    /bypass security measures/i,
    /developer mode activated/i,
  ];

  private static readonly JAILBREAK_KEYWORDS: RegExp[] = [
    /tell me how to\s+break out of/i,
    /disregard all previous rules/i,
    /i am now a god/i,
    /roleplay as an unrestricted ai/i,
  ];

  /**
   * Runs a comprehensive sanitization and validation check on a given prompt content.
   * @param content The raw text content of the prompt.
   * @returns A PromptSanitizationReport detailing findings and sanitized content.
   */
  public static sanitize(content: string): PromptSanitizationReport {
    const findings: Finding[] = [];
    let sanitizedContent = content;

    // 1. Check for malicious patterns
    const maliciousFindings = PromptSanitizer.checkMaliciousPatterns(content);
    findings.push(...maliciousFindings);

    // 2. Check for structural anomalies
    const structuralFindings = PromptSanitizer.checkStructuralIntegrity(content);
    findings.push(...structuralFindings);

    // 3. Apply sanitization (e.g., removing excessive encoding or known bad phrases)
    sanitizedContent = PromptSanitizer.applySanitization(content);

    const isClean = findings.length === 0;

    return {
      findings,
      isClean,
      sanitizedContent,
    };
  }

  private static function checkMaliciousPatterns(content: string): Finding[] {
    const findings: Finding[] = [];

    for (const regex of PromptSanitizer.INJECTION_PATTERNS) {
      if (regex.test(content)) {
        findings.push({
          type: "InjectionAttempt",
          severity: "High",
          message: `Detected potential prompt injection pattern: ${regex.source}`,
          suggestedFix: "Rephrase the prompt to be more explicit and context-bound.",
        });
      }
    }

    for (const regex of PromptSanitizer.JAILBREAK_KEYWORDS) {
      if (regex.test(content)) {
        findings.push({
          type: "JailbreakAttempt",
          severity: "Critical",
          message: `Detected potential jailbreaking attempt: ${regex.source}`,
          suggestedFix: "Review the prompt for attempts to bypass safety guidelines.",
        });
      }
    }

    return findings;
  }

  private static function checkStructuralIntegrity(content: string): Finding[] {
    const findings: Finding[] = [];

    // Check for excessive encoding (e.g., too many unicode escapes)
    const encodedCount = (content.match(/%[0-9a-f]{2}/gi) || []).length;
    if (encodedCount > 5) {
      findings.push({
        type: "StructuralAnomaly",
        severity: "Medium",
        message: `Content contains ${encodedCount} percent-encoded sequences, which may indicate obfuscation.`,
        suggestedFix: "Decode and simplify the content before submission.",
      });
    }

    // Check for excessive whitespace or null characters
    const whitespaceRatio = (content.match(/\s/g) || []).length / Math.max(1, content.length);
    if (whitespaceRatio > 0.2) {
      findings.push({
        type: "StructuralAnomaly",
        severity: "Low",
        message: "Excessive whitespace detected. Consider trimming the content.",
        suggestedFix: "Trim leading/trailing whitespace and consolidate internal spacing.",
      });
    }

    return findings;
  }

  private static function applySanitization(content: string): string {
    let sanitized = content;

    // 1. Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // 2. Basic encoding cleanup (e.g., replacing common escape sequences with visible text)
    sanitized = sanitized.replace(/%20/gi, ' ');
    sanitized = sanitized.replace(/%0A/gi, '\n');

    // 3. Simple redaction of known dangerous markers (e.g., triple quotes used for injection)
    sanitized = sanitized.replace(/\s*[\w\s]*/gi, '');

    return sanitized;
  }
}

export { PromptSanitizer };