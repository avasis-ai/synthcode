import { type Message } from "./types";

type Plan = {
    steps: string[];
    description: string;
};

type Context = {
    user_profile: Record<string, any>;
    system_constraints: string[];
    current_knowledge_base: Record<string, any>;
};

export interface ImpactReport {
    validator_name: string;
    risk_score: number;
    severity: "low" | "medium" | "high" | "critical";
    findings: string[];
    recommendations: string[];
}

export interface MitigationStep {
    priority: number;
    step_description: string;
    required_action: string;
}

export interface EthicalValidator {
    name: string;
    validate(plan: Plan, context: Context): ImpactReport;
}

class EthicalImpactSimulationPipeline {
    private validators: EthicalValidator[];

    constructor(validators: EthicalValidator[]) {
        this.validators = validators;
    }

    private calculateWeightedScore(reports: ImpactReport[]): number {
        let totalScore = 0;
        for (const report of reports) {
            let weight = 1.0;
            if (report.severity === "critical") {
                weight = 3.0;
            } else if (report.severity === "high") {
                weight = 2.0;
            } else if (report.severity === "medium") {
                weight = 1.0;
            }
            totalScore += report.risk_score * weight;
        }
        return parseFloat(totalScore.toFixed(2));
    }

    private generateMitigationPlan(reports: ImpactReport[]): MitigationStep[] {
        const uniqueMitigations = new Map<string, MitigationStep>();

        for (const report of reports) {
            if (report.severity === "critical" || report.severity === "high") {
                const description = `Address ${report.validator_name} risks: ${report.findings.join(", ")}.`;
                const action = report.recommendations.length > 0 ? report.recommendations.join(";") : "Review and refine plan steps.";
                const step: MitigationStep = {
                    priority: report.severity === "critical" ? 1 : 2,
                    step_description: description,
                    required_action: action
                };

                if (!uniqueMitigations.has(description)) {
                    uniqueMitigations.set(description, step);
                }
            }
        }

        return Array.from(uniqueMitigations.values()).sort((a, b) => a.priority - b.priority);
    }

    public async simulate(plan: Plan, context: Context): Promise<{
        final_report: {
            total_risk_score: number;
            overall_severity: "low" | "medium" | "high" | "critical";
            aggregated_reports: ImpactReport[];
        };
        mitigation_plan: MitigationStep[];
    }> {
        const reports: ImpactReport[] = [];

        for (const validator of this.validators) {
            const report = validator.validate(plan, context);
            reports.push(report);
        }

        const totalRiskScore = this.calculateWeightedScore(reports);
        let overallSeverity: "low" | "medium" | "high" | "critical" = "low";

        if (totalRiskScore >= 10) {
            overallSeverity = "critical";
        } else if (totalRiskScore >= 5) {
            overallSeverity = "high";
        } else if (totalRiskScore >= 2) {
            overallSeverity = "medium";
        }

        const mitigationPlan = this.generateMitigationPlan(reports);

        return {
            final_report: {
                total_risk_score: totalRiskScore,
                overall_severity: overallSeverity,
                aggregated_reports: reports
            },
            mitigation_plan: mitigationPlan
        };
    }
}

export { EthicalImpactSimulationPipeline };