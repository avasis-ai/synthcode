import {
    Message,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types.js";

type Severity = "CRITICAL" | "WARNING" | "INFO";

export interface ComplianceRule {
    scope: string;
    severity: Severity;
    check: (context: ComplianceContext) => boolean;
    description: string;
}

export interface ComplianceContext {
    history: Message[];
    currentPayload: Record<string, unknown>;
    executionStep: string;
}

export interface ComplianceViolation {
    ruleScope: string;
    severity: Severity;
    message: string;
    isViolation: boolean;
}

export interface ComplianceReport {
    violations: ComplianceViolation[];
    isCompliant: boolean;
    summary: string;
}

export class RegulatoryComplianceMonitor {
    private rules: ComplianceRule[];

    constructor(rules: ComplianceRule[]) {
        this.rules = rules;
    }

    private generateReport(violations: ComplianceViolation[]): ComplianceReport {
        const isCompliant = violations.every(v => v.severity !== "CRITICAL" || v.isViolation === false);
        
        let summary = `Compliance Check Complete. ${violations.filter(v => v.isViolation).length} violations found. `;
        if (isCompliant) {
            summary += "The execution step appears compliant.";
        } else {
            summary += "CRITICAL violations detected. Plan adjustment or halting is recommended.";
        }

        return {
            violations: violations,
            isCompliant: isCompliant,
            summary: summary,
        };
    }

    monitorExecutionStep(context: ComplianceContext): ComplianceReport {
        const violations: ComplianceViolation[] = [];

        for (const rule of this.rules) {
            try {
                const passed = rule.check(context);
                
                violations.push({
                    ruleScope: rule.scope,
                    severity: rule.severity,
                    message: rule.description,
                    isViolation: !passed,
                });
            } catch (error) {
                violations.push({
                    ruleScope: rule.scope,
                    severity: "CRITICAL",
                    message: `Rule execution failed for ${rule.scope}: ${(error as Error).message}`,
                    isViolation: true,
                });
            }
        }

        return this.generateReport(violations);
    }
}