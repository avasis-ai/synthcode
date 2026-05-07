export type Message = {
    role: "user" | "assistant" | "tool";
    content: any;
}

export interface PlanContext {
    plan: Message[];
    history: Message[];
}

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface VulnerabilityReport {
    ruleName: string;
    severity: Severity;
    isVulnerable: boolean;
    description: string;
    suggestedMitigation: string;
}

export type AdversarialRule = (context: PlanContext) => VulnerabilityReport;

export class AdversarialPlanValidator {
    private rules: AdversarialRule[];

    constructor(rules: AdversarialRule[]) {
        this.rules = rules;
    }

    validate(context: PlanContext): VulnerabilityReport[] {
        const reports: VulnerabilityReport[] = [];
        for (const rule of this.rules) {
            const report = rule(context);
            reports.push(report);
        }
        return reports;
    }
}

export { AdversarialPlanValidator };