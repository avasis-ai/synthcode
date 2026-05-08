export type Message = any;

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: any[];
}

export interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type ContentBlock = any;

export interface TextBlock {
    type: "text";
    text: string;
}

export interface ToolUseBlock {
    type: "tool_use";
    id: string;
    name: string;
    input: Record<string, unknown>;
}

export interface ThinkingBlock {
    type: "thinking";
    thinking: string;
}

export type LoopEvent = any;

export type PolicyContext = Record<string, unknown>;

export type PolicyResult = {
    passed: boolean;
    severity: "CRITICAL" | "ERROR" | "WARNING" | "INFO";
    message: string;
    details?: Record<string, unknown>;
};

export interface PolicyRule {
    policyType: string;
    priority: number;
    execute: (context: PolicyContext) => Promise<PolicyResult>;
}

export interface EnforcementReport {
    overallSuccess: boolean;
    criticalFailures: PolicyResult[];
    errors: PolicyResult[];
    warnings: PolicyResult[];
    info: PolicyResult[];
    summary: string;
}

export class ContextualPolicyEnforcer {
    private rules: PolicyRule[];

    constructor() {}

    public setRules(rules: PolicyRule[]): void {
        this.rules = rules;
    }

    public async enforce(context: PolicyContext): Promise<EnforcementReport> {
        const sortedRules = [...this.rules].sort((a, b) => b.priority - a.priority);
        
        let criticalFailures: PolicyResult[] = [];
        let errors: PolicyResult[] = [];
        let warnings: PolicyResult[] = [];
        let info: PolicyResult[] = [];

        for (const rule of sortedRules) {
            try {
                const result = await rule.execute(context);

                if (!result) continue;

                if (result.severity === "CRITICAL") {
                    criticalFailures.push(result);
                    // Early exit on critical failure
                    return {
                        overallSuccess: false,
                        criticalFailures: [result],
                        errors: [],
                        warnings: [],
                        info: [],
                        summary: `Enforcement failed critically at policy: ${rule.policyType}.`
                    };
                } else if (result.severity === "ERROR") {
                    errors.push(result);
                } else if (result.severity === "WARNING") {
                    warnings.push(result);
                } else {
                    info.push(result);
                }
            } catch (e) {
                const errorResult: PolicyResult = {
                    passed: false,
                    severity: "ERROR",
                    message: `Execution failed for policy ${rule.policyType}: ${(e as Error).message}`,
                };
                errors.push(errorResult);
            }
        }

        const overallSuccess = criticalFailures.length === 0;
        const summary = overallSuccess 
            ? `Policy enforcement successful. ${info.length} checks passed, ${warnings.length} warnings issued.`
            : `Policy enforcement failed. ${criticalFailures.length} critical failures detected.`;

        return {
            overallSuccess: overallSuccess,
            criticalFailures: criticalFailures,
            errors: errors,
            warnings: warnings,
            info: info,
            summary: summary
        };
    }
}

export { ContextualPolicyEnforcer };