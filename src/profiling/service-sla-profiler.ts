import { Message } from "./types";

interface ServiceMetrics {
  timestamp: number;
  latency_ms: number;
  error_rate: number;
  throughput_rps: number;
}

export interface SLOs {
  max_latency_ms: number;
  max_error_rate: number;
  min_throughput_rps: number;
}

export interface ProfilingState {
  metricsHistory: ServiceMetrics[];
  ewmaLatency: number;
  ewmaErrorRate: number;
  ewmaThroughput: number;
}

export class ServiceSLAProfiler {
  private state: ProfilingState;
  private readonly alpha: number;

  constructor(initialSLOs: SLOs, initialMetrics: ServiceMetrics[] = []) {
    this.state = {
      metricsHistory: initialMetrics,
      ewmaLatency: initialSLOs.max_latency_ms,
      ewmaErrorRate: 0,
      ewmaThroughput: 0,
    };
    this.alpha = 0.2; // Smoothing factor for EWMA
  }

  private calculateDegradationScore(currentMetrics: ServiceMetrics, slo: SLOs): number {
    const latencyPenalty = Math.max(0, currentMetrics.latency_ms - slo.max_latency_ms) / slo.max_latency_ms;
    const errorPenalty = Math.max(0, currentMetrics.error_rate - slo.max_error_rate) / slo.max_error_rate;
    const throughputPenalty = Math.max(0, slo.min_throughput_rps - currentMetrics.throughput_rps) / slo.min_throughput_rps;

    // Weighted score: Latency is often the most critical
    return (latencyPenalty * 0.5 + errorPenalty * 0.3 + throughputPenalty * 0.2).toFixed(2) * 100;
  }

  public updateMetrics(metrics: ServiceMetrics, slo: SLOs): { score: number; compliant: boolean; message: string } {
    if (typeof metrics.timestamp !== 'number' || metrics.latency_ms === undefined) {
      return { score: 0, compliant: true, message: "Invalid metrics provided." };
    }

    // 1. Update EWMA
    this.state.ewmaLatency = (this.alpha * metrics.latency_ms) + ((1 - this.alpha) * this.state.ewmaLatency);
    this.state.ewmaErrorRate = (this.alpha * metrics.error_rate) + ((1 - this.alpha) * this.state.ewmaErrorRate);
    this.state.ewmaThroughput = (this.alpha * metrics.throughput_rps) + ((1 - this.alpha) * this.state.ewmaThroughput);

    // 2. Update History
    this.state.metricsHistory = [...this.state.metricsHistory, metrics];

    // 3. Calculate Degradation Score
    const degradationScore = this.calculateDegradationScore(metrics, slo);
    const scoreValue = parseFloat(degradationScore);

    // 4. Check Compliance
    const isCompliant = scoreValue < 10; // Threshold of 10 (arbitrary)

    let message = `Service health check passed. Predicted degradation score: ${scoreValue.toFixed(2)}/100.`;
    if (!isCompliant) {
      message = `WARNING: Predicted service degradation detected. Score: ${scoreValue.toFixed(2)}/100. Current metrics exceed SLOs.`;
    }

    return {
      score: scoreValue,
      compliant: isCompliant,
      message: message,
    };
  }

  public getPredictionReport(): { score: number; compliant: boolean; message: string } {
    // Use the latest recorded metrics for the prediction
    const latestMetrics = this.state.metricsHistory[this.state.metricsHistory.length - 1] || {
      timestamp: Date.now(),
      latency_ms: 0,
      error_rate: 0,
      throughput_rps: 0,
    };

    const report = this.updateMetrics(latestMetrics, {
      max_latency_ms: 1000,
      max_error_rate: 0.05,
      min_throughput_rps: 5,
    });

    return report;
  }
}

export { ServiceSLAProfiler };