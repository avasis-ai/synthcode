import { EventEmitter } from 'node:events';

type ObservationId = string;

interface MetricObservation {
    id: ObservationId;
    metricName: string;
    value: number;
    threshold: number;
    isHigh: boolean;
}

interface ConstraintViolationObservation {
    id: ObservationId;
    constraintName: string;
    violationDetails: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface ContextDiffObservation {
    id: ObservationId;
    diffPath: string;
    oldValue: unknown;
    newValue: unknown;
    impactLevel: 'MINOR' | 'MAJOR';
}

interface ErrorObservation {
    id: ObservationId;
    errorCode: string;
    message: string;
    stackTrace?: string;
}

type Observation = MetricObservation | ConstraintViolationObservation | ContextDiffObservation | ErrorObservation;

interface RemediationStep {
    priority: number;
    action: string;
    description: string;
}

interface DiagnosisReport {
    rootCauseHypothesis: string;
    confidenceScore: number;
    summaryFindings: string[];
    remediationSteps: RemediationStep[];
}

class ObservationSynthesisEngine {
    private readonly correlationWeights: Record<string, number> = {
        'RESOURCE_STARVATION': 0.3,
        'CONFIG_DRIFT': 0.2,
        'LATENCY_SPIKE': 0.25,
        'CRITICAL_ERROR': 0.25,
    };

    synthesize(observations: Observation[]): DiagnosisReport {
        if (!observations || observations.length === 0) {
            return {
                rootCauseHypothesis: "No observations provided.",
                confidenceScore: 0.0,
                summaryFindings: [],
                remediationSteps: [],
            };
        }

        const findings = this.analyzeObservations(observations);
        const { rootCause, score, summary } = this.correlateFindings(findings);

        const remediationSteps = this.generateRemediation(findings);

        return {
            rootCauseHypothesis: rootCause,
            confidenceScore: Math.min(1.0, score),
            summaryFindings: summary,
            remediationSteps: remediationSteps,
        };
    }

    private analyzeObservations(observations: Observation[]): {
        resourceStarvation: boolean;
        configDrift: boolean;
        latencySpike: boolean;
        criticalError: boolean;
    } {
        let resourceStarvation = false;
        let configDrift = false;
        let latencySpike = false;
        let criticalError = false;

        for (const obs of observations) {
            if (obs.metricName && (obs as MetricObservation).isHigh) {
                if ((obs as MetricObservation).metricName.includes('latency')) {
                    latencySpike = true;
                }
            }
            if (obs.severity === 'HIGH') {
                resourceStarvation = true;
            }
            if (obs.impactLevel === 'MAJOR') {
                configDrift = true;
            }
            if (obs.errorCode && (obs as ErrorObservation).errorCode.includes('CRITICAL')) {
                criticalError = true;
            }
        }

        return {
            resourceStarvation,
            configDrift,
            latencySpike,
            criticalError,
        };
    }

    private correlateFindings(findings: {
        resourceStarvation: boolean;
        configDrift: boolean;
        latencySpike: boolean;
        criticalError: boolean;
    }): {
        rootCause: string;
        score: number;
        summary: string[];
    } {
        let totalScore = 0;
        const summary: string[] = [];

        if (findings.resourceStarvation) {
            totalScore += this.correlationWeights['RESOURCE_STARVATION'];
            summary.push("Potential resource exhaustion detected.");
        }
        if (findings.configDrift) {
            totalScore += this.correlationWeights['CONFIG_DRIFT'];
            summary.push("Configuration mismatch suggests drift.");
        }
        if (findings.latencySpike) {
            totalScore += this.correlationWeights['LATENCY_SPIKE'];
            summary.push("Significant latency spikes observed.");
        }
        if (findings.criticalError) {
            totalScore += this.correlationWeights['CRITICAL_ERROR'];
            summary.push("Critical system error reported.");
        }

        let rootCause: string;
        if (findings.resourceStarvation && findings.latencySpike) {
            rootCause = "High probability of resource starvation causing performance degradation.";
        } else if (findings.criticalError && findings.configDrift) {
            rootCause = "Critical failure likely triggered by recent configuration changes.";
        } else if (totalScore > 0.7) {
            rootCause = "Complex interaction of multiple factors suggests systemic instability.";
        } else {
            rootCause = "Multiple minor issues detected; root cause requires deeper investigation.";
        }

        return {
            rootCause,
            score: totalScore,
            summary,
        };
    }

    private generateRemediation(findings: {
        resourceStarvation: boolean;
        configDrift: boolean;
        latencySpike: boolean;
        criticalError: boolean;
    }): RemediationStep[] {
        const steps: RemediationStep[] = [];

        if (findings.resourceStarvation) {
            steps.push({
                priority: 1,
                action: "Scale up resources",
                description: "Increase CPU/Memory allocation to mitigate potential starvation."
            });
        }
        if (findings.configDrift) {
            steps.push({
                priority: 2,
                action: "Validate configuration",
                description: "Compare current state against baseline configuration and revert major drifts."
            });
        }
        if (findings.latencySpike) {
            steps.push({
                priority: 3,
                action: "Analyze slow queries/endpoints",
                description: "Investigate recent code changes or database query performance."
            });
        }
        if (findings.criticalError) {
            steps.push({
                priority: 0,
                action: "Immediate rollback/hotfix",
                description: "Address the critical error immediately, potentially rolling back the last deployment."
            });
        }

        // Sort by priority (0 is highest)
        return steps.sort((a, b) => a.priority - b.priority);
    }
}

export { ObservationSynthesisEngine };