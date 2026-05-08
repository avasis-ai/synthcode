interface Metric {
    name: string;
    value: number;
    unit: string;
}

export interface OperationalConstraint {
    name: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    guidance: string;
}

export class EnvironmentalConstraintMonitor {
    private thresholds: Record<string, {
        threshold: number;
        severity: 'medium' | 'high';
        guidance: string;
    }>;

    constructor(thresholds: Record<string, {
        threshold: number;
        severity: 'medium' | 'high';
        guidance: string;
    }>) {
        this.thresholds = thresholds;
    }

    checkConstraints(metrics: Metric[]): OperationalConstraint[] {
        const constraints: OperationalConstraint[] = [];

        for (const metric of metrics) {
            const config = this.thresholds[metric.name];

            if (config && metric.value > config.threshold) {
                constraints.push({
                    name: `${metric.name}_high`,
                    severity: config.severity,
                    description: `${metric.name} (${metric.value}${metric.unit}) exceeds threshold (${config.threshold}${metric.unit}).`,
                    guidance: config.guidance,
                });
            }
        }

        return constraints;
    }
}

export { EnvironmentalConstraintMonitor }