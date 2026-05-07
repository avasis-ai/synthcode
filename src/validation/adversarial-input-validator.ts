import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  Message,
} from "./types";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CheckResult {
  passed: boolean;
  riskLevel: RiskLevel;
  finding: string;
}

export interface AdversarialReport {
  overallRisk: RiskLevel;
  checks: {
    name: string;
    result: CheckResult;
  }[];
  isBlocked: boolean;
}

abstract class AdversarialCheck {
  abstract getName(): string;
  abstract check(input: string): CheckResult;
}

class InjectionCheck extends AdversarialCheck {
  getName(): string {
    return "Prompt Injection Check";
  }

  check(input: string): CheckResult {
    const injectionPatterns = [
      /(ignore previous instructions|disregard the above|act as if)/i,
      /system prompt:|system instruction:/i,
      /ignore all previous instructions/i,
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(input)) {
        return {
          passed: false,
          riskLevel: "HIGH",
          finding: `Potential prompt injection detected using pattern: ${pattern.source}`,
        };
      }
    }

    return {
      passed: true,
      riskLevel: "LOW",
      finding: "No obvious prompt injection patterns found.",
    };
  }
}

class RoleReversalCheck extends AdversarialCheck {
  getName(): string {
    return "Role Reversal Check";
  }

  check(input: string): CheckResult {
    const reversalTriggers = [
      /you are now a different persona/i,
      /from now on, you must act as/i,
      /you must pretend to be/i,
    ];

    for (const trigger of reversalTriggers) {
      if (trigger.test(input)) {
        return {
          passed: false,
          riskLevel: "MEDIUM",
          finding: "Potential role reversal attempt detected. Input tries to force a new persona.",
        };
      }
    }

    return {
      passed: true,
      riskLevel: "LOW",
      finding: "No explicit role reversal attempts detected.",
    };
  }
}

class SensitiveDataCheck extends AdversarialCheck {
  getName(): string {
    return "Sensitive Data Leakage Check";
  }

  check(input: string): CheckResult {
    const sensitivePatterns = [
      /(password|pwd|pass)\s*[:\s]*[\w]{8,}/i,
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Simple US SSN pattern
      /(email|user)[\s\.:]*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(input)) {
        return {
          passed: false,
          riskLevel: "CRITICAL",
          finding: "Highly sensitive data (e.g., credentials, SSN, email) detected in the input.",
        };
      }
    }

    return {
      passed: true,
      riskLevel: "LOW",
      finding: "No obvious sensitive data leakage detected.",
    };
  }
}

export class AdversarialInputValidator {
  private checks: AdversarialCheck[];
  private readonly blockThreshold: RiskLevel;

  constructor(blockThreshold: RiskLevel = "HIGH") {
    this.checks = [
      new InjectionCheck(),
      new RoleReversalCheck(),
      new SensitiveDataCheck(),
    ];
    this.blockThreshold = blockThreshold;
  }

  private determineOverallRisk(results: CheckResult[]): RiskLevel {
    let maxRisk: RiskLevel = "LOW";

    const riskOrder: Record<RiskLevel, number> = {
      "LOW": 1,
      "MEDIUM": 2,
      "HIGH": 3,
      "CRITICAL": 4,
    };

    for (const result of results) {
      const currentRiskValue = riskOrder[result.riskLevel];
      const maxRiskValue = riskOrder[maxRisk];

      if (currentRiskValue && (maxRiskValue === undefined || currentRiskValue > maxRiskValue)) {
        maxRisk = result.riskLevel;
      }
    }
    return maxRisk;
  }

  public validate(input: string): { isValid: boolean, report: AdversarialReport } {
    const checkResults: CheckResult[] = [];
    const findings: { name: string; result: CheckResult }[] = [];

    for (const check of this.checks) {
      const result = check.check(input);
      checkResults.push(result);
      findings.push({ name: check.getName(), result });
    }

    const overallRisk = this.determineOverallRisk(checkResults);
    const isBlocked = this.compareRisk(overallRisk, this.blockThreshold) >= 0;

    const report: AdversarialReport = {
      overallRisk: overallRisk,
      checks: findings,
      isBlocked: isBlocked,
    };

    return {
      isValid: !isBlocked,
      report: report,
    };
  }

  private compareRisk(current: RiskLevel, threshold: RiskLevel): number {
    const riskOrder: Record<RiskLevel, number> = {
      "LOW": 1,
      "MEDIUM": 2,
      "HIGH": 3,
      "CRITICAL": 4,
    };
    return riskOrder[current]! - riskOrder[threshold]!;
  }
}