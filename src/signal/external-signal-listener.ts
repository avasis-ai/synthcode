export interface ExternalSignal {
    source: string;
    timestamp: number;
    payload: Record<string, unknown>;
}

export interface PlanAdjustment {
    triggerId: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    reason: string;
    suggestedAction: string;
}

export type SignalRule = {
    id: string;
    description: string;
    // The predicate function evaluates the signal against the rule's criteria
    predicate: (signal: ExternalSignal) => boolean;
    // Function to generate the adjustment payload if the rule matches
    adjustmentGenerator: (signal: ExternalSignal) => PlanAdjustment;
};

export class ExternalSignalListener {
    private rules: SignalRule[] = [];

    constructor() {}

    /**
     * Registers a new signal rule with the listener.
     * @param rule The signal rule definition.
     */
    public registerRule(rule: SignalRule): void {
        this.rules.push(rule);
    }

    /**
     * Processes an incoming external signal, evaluating it against all registered rules.
     * If a rule matches, it generates and returns a PlanAdjustment event.
     * @param signal The external signal received.
     * @returns An array of PlanAdjustment events triggered by the signal.
     */
    public listen(signal: ExternalSignal): PlanAdjustment[] {
        const triggeredAdjustments: PlanAdjustment[] = [];

        for (const rule of this.rules) {
            if (rule.predicate(signal)) {
                const adjustment = rule.adjustmentGenerator(signal);
                triggeredAdjustments.push(adjustment);
            }
        }

        return triggeredAdjustments;
    }
}

export { ExternalSignalListener };