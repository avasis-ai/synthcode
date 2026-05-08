export type ExecutionStep = {
    type: "tool_call" | "message";
    data: any;
    timestamp: number;
};

export type ExecutionContext = {
    history: ExecutionStep[];
    lastStepTimestamp: number;
    // Add other context data if needed, e.g., session ID
};

export interface FlowRule {
    id: string;
    description: string;
    // Rule 1: Sequential constraint (What must precede this step?)
    requiredPrecedingStepType?: "tool_call" | "message";
    requiredPrecedingStepName?: string;
    // Rule 2: Temporal constraint (How long should it take?)
    maxTimeDeltaMs?: number;
    // Rule 3: Exclusion constraint (What must NOT precede this step?)
    forbiddenPrecedingStepType?: "tool_call" | "message";
}

export interface AnomalyReport {
    ruleId: string;
    ruleDescription: string;
    severity: "CRITICAL" | "WARNING";
    message: string;
    violationDetails: Record<string, any>;
}

export class ExecutionFlowAnomalyDetector {
    private rules: FlowRule[] = [];

    constructor() {}

    public registerRule(rule: FlowRule): void {
        this.rules.push(rule);
    }

    public validate(context: ExecutionContext, currentStep: ExecutionStep): AnomalyReport[] {
        const anomalies: AnomalyReport[] = [];

        for (const rule of this.rules) {
            let violation: AnomalyReport | null = null;

            // 1. Check Preceding Step Constraints
            const history = context.history;
            if (history.length > 0) {
                const lastStep = history[history.length - 1];

                // Check required preceding step
                if (rule.requiredPrecedingStepType && lastStep.type !== rule.requiredPrecedingStepType) {
                    violation = {
                        ruleId: rule.id,
                        ruleDescription: rule.description,
                        severity: "CRITICAL",
                        message: `Expected preceding step type ${rule.requiredPrecedingStepType}, but found ${lastStep.type}.`,
                        violationDetails: { expected: rule.requiredPrecedingStepType, actual: lastStep.type }
                    };
                }

                // Check forbidden preceding step
                if (rule.forbiddenPrecedingStepType && lastStep.type === rule.forbiddenPrecedingStepType) {
                    violation = {
                        ruleId: rule.id,
                        ruleDescription: rule.description,
                        severity: "CRITICAL",
                        message: `Cannot follow ${rule.forbiddenPrecedingStepType}. Flow violation detected.`,
                        violationDetails: { forbidden: rule.forbiddenPrecedingStepType, actual: lastStep.type }
                    };
                }
            }

            // 2. Check Temporal Constraints
            if (rule.maxTimeDeltaMs !== undefined) {
                const timeDelta = currentStep.timestamp - context.lastStepTimestamp;
                if (timeDelta > rule.maxTimeDeltaMs) {
                    violation = {
                        ruleId: rule.id,
                        ruleDescription: rule.description,
                        severity: "WARNING",
                        message: `Execution time delta (${timeDelta}ms) exceeds allowed maximum (${rule.maxTimeDeltaMs}ms).`,
                        violationDetails: { actualDelta: timeDelta, maxAllowed: rule.maxTimeDeltaMs }
                    };
                }
            }

            // If a violation was found, add it. We prioritize the first detected violation for simplicity,
            // but in a real system, we might collect all. Here, we just add the violation if it exists.
            if (violation) {
                anomalies.push(violation);
            }
        }

        return anomalies;
    }
}

export { ExecutionFlowAnomalyDetector };