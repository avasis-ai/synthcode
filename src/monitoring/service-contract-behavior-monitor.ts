import { EventEmitter } from 'node:events';

type ServiceCallMetrics = {
  latencyMs: number;
  success: boolean;
  payload: Record<string, unknown>;
};

interface ServiceContract {
  requiredFields: string[];
  maxLatencyMs: number;
  errorDistributionSchema: Record<string, number>;
}

interface BaselineMetrics {
  totalCalls: number;
  totalLatencyMs: number;
  latencySamples: number[];
  successCounts: number[];
  errorDistribution: Record<string, number>;
}

interface BehavioralDriftReport {
  driftDetected: boolean;
  messages: string[];
  details: {
    latencyDrift: number | null;
    errorRateDrift: number | null;
    schemaDrift: number | null;
  };
}

export class ServiceContractBehaviorMonitor extends EventEmitter {
  private contract: ServiceContract;
  private baseline: BaselineMetrics;
  private history: ServiceCallMetrics[] = [];
  private readonly Z_SCORE_THRESHOLD: number = 2.5;
  private readonly KL_DIVERGENCE_THRESHOLD: number = 0.1;

  constructor(contract: ServiceContract, baseline: BaselineMetrics) {
    super();
    this.contract = contract;
    this.baseline = baseline;
  }

  private calculateMean(samples: number[]): number {
    if (samples.length === 0) return 0;
    return samples.reduce((acc, val) => acc + val, 0) / samples.length;
  }

  private calculateStdDev(samples: number[], mean: number): number {
    if (samples.length < 2) return 0;
    const variance = samples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (samples.length - 1);
    return Math.sqrt(variance);
  }

  private calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return Math.abs(value - mean) / stdDev;
  }

  private calculateKLDivergence(p: Record<string, number>, q: Record<string, number>): number {
    let divergence = 0;
    const allKeys = new Set([...Object.keys(p), ...Object.keys(q)]);

    for (const key of allKeys) {
      const pk = p[key] || 0;
      const qk = q[key] || 0;

      if (pk > 0 && qk > 0) {
        divergence += pk * Math.log(pk / qk);
      } else if (pk > 0 && qk === 0) {
        // Infinite divergence if probability is non-zero but baseline is zero
        return Infinity;
      }
    }
    return divergence;
  }

  public recordMetrics(metrics: ServiceCallMetrics): void {
    this.history.push(metrics);
  }

  public checkDrift(): BehavioralDriftReport {
    if (this.history.length === 0) {
      return {
        driftDetected: false,
        messages: ["No metrics recorded to check for drift."],
        details: { latencyDrift: null, errorRateDrift: null, schemaDrift: null },
      };
    }

    const currentLatencies = this.history.map(m => m.latencyMs);
    const currentSuccesses = this.history.filter(m => m.success).length;
    const currentTotalCalls = this.history.length;
    const currentErrorDistribution: Record<string, number> = {
      'success': currentSuccesses,
      'failure': currentTotalCalls - currentSuccesses,
    };

    // 1. Latency Drift Check (Z-Score)
    const currentMeanLatency = this.calculateMean(currentLatencies);
    const currentStdDevLatency = this.calculateStdDev(currentLatencies, currentMeanLatency);
    const zScore = this.calculateZScore(currentMeanLatency, this.calculateMean(this.baseline.latencySamples), this.calculateStdDev(this.baseline.latencySamples, this.calculateMean(this.baseline.latencySamples)));
    const latencyDrift = zScore > this.Z_SCORE_THRESHOLD;

    // 2. Error Rate/Distribution Drift Check (KL Divergence)
    const baselineErrorDistribution = this.baseline.errorDistribution;
    const klDivergence = this.calculateKLDivergence(currentErrorDistribution, baselineErrorDistribution);
    const errorRateDrift = klDivergence > this.KL_DIVERGENCE_THRESHOLD;

    // 3. Schema/Field Distribution Check (Simple check)
    const schemaDrift = this.history.some(m => Object.keys(m.payload).length !== this.contract.requiredFields.length);

    const driftDetected = latencyDrift || errorRateDrift || schemaDrift;

    const messages: string[] = [];
    if (latencyDrift) {
      messages.push(`High latency drift detected. Z-Score: ${zScore.toFixed(2)}. Current Mean: ${currentMeanLatency.toFixed(2)}ms.`);
    }
    if (errorRateDrift) {
      messages.push(`Significant error distribution drift detected. KL Divergence: ${klDivergence.toFixed(2)}.`);
    }
    if (schemaDrift) {
      messages.push(`Schema drift detected. Payload field count mismatch.`);
    }

    return {
      driftDetected: driftDetected,
      messages: messages.length > 0 ? messages : ["No significant behavioral drift detected."],
      details: {
        latencyDrift: latencyDrift ? zScore : null,
        errorRateDrift: errorRateDrift ? klDivergence : null,
        schemaDrift: schemaDrift ? 1 : null,
      },
    };
  }
}