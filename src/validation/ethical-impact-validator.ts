import {
    Message,
    ToolUseBlock,
    TextBlock,
    ThinkingBlock,
} from "../types";

type ToolCallContext = {
    toolName: string;
    toolInput: Record<string, unknown>;
    planStepDescription: string;
};

type PlanStep = {
    description: string;
    context: ToolCallContext;
};

interface EthicalCheckResult {
    checkName: string;
    isEthical: boolean;
    severity: "LOW" | "MEDIUM" | "HIGH";
    details: string;
}

export interface EthicalImpactReport {
    overallRiskLevel: "LOW" | "MEDIUM" | "HIGH";
    isPermissible: boolean;
    checks: EthicalCheckResult[];
    summary: string;
}

export class EthicalImpactValidator {
    private results: EthicalCheckResult[] = [];

    private reset() {
        this.results = [];
    }

    private aggregateResults(context: ToolCallContext | PlanStep): EthicalImpactReport {
        const results = this.results;
        let overallRisk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
        let isPermissible = true;
        let summary: string = "Ethical validation passed with minor considerations.";

        const highRiskFound = results.some(r => r.severity === "HIGH");
        const mediumRiskFound = results.some(r => r.severity === "MEDIUM");

        if (highRiskFound) {
            overallRisk = "HIGH";
            isPermissible = false;
            summary = "Execution halted: High ethical risk detected (Bias/Misuse). Plan modification required.";
        } else if (mediumRiskFound) {
            overallRisk = "MEDIUM";
            isPermissible = false;
            summary = "Execution warned: Medium ethical risk detected (Fairness concern). Proceed with caution and human review.";
        } else {
            overallRisk = "LOW";
            summary = "Ethical validation passed. No significant risks identified.";
        }

        return {
            overallRiskLevel: overallRisk,
            isPermissible: isPermissible,
            checks: results,
            summary: summary,
        };
    }

    public checkBias(context: ToolCallContext | PlanStep): EthicalCheckResult {
        const step = context as PlanStep;
        const description = step.description;
        const input = JSON.stringify(context.toolInput);

        if (description.toLowerCase().includes("vulnerable") && input.includes("age")) {
            return {
                checkName: "Bias Check (Vulnerability)",
                isEthical: false,
                severity: "HIGH",
                details: "The plan targets vulnerable groups using age-specific data, risking discriminatory profiling.",
            };
        }
        return {
            checkName: "Bias Check (Vulnerability)",
            isEthical: true,
            severity: "LOW",
            details: "No immediate bias indicators found based on current context.",
        };
    }

    public checkFairness(context: ToolCallContext | PlanStep): EthicalCheckResult {
        const step = context as PlanStep;
        const description = step.description;

        if (description.toLowerCase().includes("credit") && context.toolName.includes("financial")) {
            return {
                checkName: "Fairness Check (Disparity)",
                isEthical: false,
                severity: "MEDIUM",
                details: "Financial tool usage may disproportionately affect certain demographic groups (e.g., income level). Fairness review needed.",
            };
        }
        return {
            checkName: "Fairness Check (Disparity)",
            isEthical: true,
            severity: "LOW",
            details: "Fairness metrics appear stable for the planned action.",
        };
    }

    public checkMisuse(context: ToolCallContext | PlanStep): EthicalCheckResult {
        const step = context as PlanStep;
        const description = step.description;

        if (description.toLowerCase().includes("weapon") || description.toLowerCase().includes("harm")) {
            return {
                checkName: "Misuse Check (Harm)",
                isEthical: false,
                severity: "HIGH",
                details: "The planned action involves high-risk domains (weaponry/harm). Requires explicit human oversight and policy review.",
            };
        }
        return {
            checkName: "Misuse Check (Harm)",
            isEthical: true,
            severity: "LOW",
            details: "No indicators of misuse or harmful intent detected.",
        };
    }

    public validate(context: ToolCallContext | PlanStep): EthicalImpactReport {
        this.reset();

        this.results.push(this.checkBias(context));
        this.results.push(this.checkFairness(context));
        this.results.push(this.checkMisuse(context));

        return this.aggregateResults(context);
    }
}