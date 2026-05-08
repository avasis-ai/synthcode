import { EventEmitter } from 'node:events';

type SignalType = "latency" | "trust" | "resource" | "general";

interface SignalInput {
    signalType: SignalType;
    source: string;
    severity: number;
    payload: Record<string, unknown>;
}

interface AggregatedSignal {
    totalSeverity: number;
    sources: Set<string>;
    averageSeverity: number;
    payloads: Record<string, unknown>;
}

interface SystemStateUpdate {
    isCritical: boolean;
    overallScore: number;
    actionableMessage: string;
    updatedSignals: Record<SignalType, { score: number; message: string }>;
}

export class SignalFusionCoordinator {
    private readonly signalWeighting: Record<SignalType, number>;

    constructor(signalWeighting: Record<SignalType, number> = {
        latency: 0.4,
        trust: 0.3,
        resource: 0.3,
        general: 0.1,
    }) {
        this.signalWeighting = signalWeighting;
    }

    private aggregateSignals(signals: SignalInput[]): Record<SignalType, AggregatedSignal> {
        const aggregated: Record<SignalType, AggregatedSignal> = {};

        for (const signal of signals) {
            if (!aggregated[signal.signalType]) {
                aggregated[signal.signalType] = {
                    totalSeverity: 0,
                    sources: new Set<string>(),
                    averageSeverity: 0,
                    payloads: {},
                };
            }

            const existing = aggregated[signal.signalType]!;
            
            existing.totalSeverity += signal.severity;
            existing.sources.add(signal.source);
            existing.payloads[signal.source] = signal.payload;
        }

        const result: Record<SignalType, AggregatedSignal> = {};
        for (const type in aggregated) {
            const signal = aggregated[type];
            const count = signal.sources.size;
            result[type] = {
                totalSeverity: signal.totalSeverity,
                sources: signal.sources,
                averageSeverity: signal.totalSeverity / count,
                payloads: signal.payloads,
            };
        }
        return result;
    }

    private resolveConflictAndGenerateUpdate(aggregatedSignals: Record<SignalType, AggregatedSignal>): SystemStateUpdate {
        let overallScore = 0;
        const updatedSignals: Record<SignalType, { score: number; message: string }> = {};

        for (const type in aggregatedSignals) {
            const signal = aggregatedSignals[type];
            const weight = this.signalWeighting[type] || 0.1;
            
            // Composite Score Calculation: Weighted Average Severity
            const compositeScore = signal.averageSeverity * weight;
            overallScore += compositeScore;

            let message = "";
            if (type === "latency") {
                message = `Average latency detected (${signal.averageSeverity.toFixed(1)}). Sources: ${Array.from(signal.sources).join(', ')}.`;
            } else if (type === "trust") {
                message = `Trust score average (${signal.averageSeverity.toFixed(1)}). Potential source conflict detected.`;
            } else if (type === "resource") {
                message = `Resource utilization warning (${signal.averageSeverity.toFixed(1)}). Check payload for details.`;
            } else {
                message = `General signal update from ${Array.from(signal.sources).join(', ')}.`;
            }

            updatedSignals[type] = { score: compositeScore, message };
        }

        const isCritical = overallScore > 3.0;
        let actionableMessage = `System State Update: Overall Score ${overallScore.toFixed(2)}. `;
        if (isCritical) {
            actionableMessage += "CRITICAL ALERT: Immediate intervention required.";
        } else {
            actionableMessage += "System operating within expected parameters.";
        }

        return {
            isCritical,
            overallScore,
            actionableMessage,
            updatedSignals,
        };
    }

    public processSignals(signals: SignalInput[]): SystemStateUpdate {
        if (!signals || signals.length === 0) {
            return {
                isCritical: false,
                overallScore: 0,
                actionableMessage: "No signals received. System nominal.",
                updatedSignals: {}
            };
        }

        const aggregated = this.aggregateSignals(signals);
        return this.resolveConflictAndGenerateUpdate(aggregated);
    }
}

export { SignalFusionCoordinator };