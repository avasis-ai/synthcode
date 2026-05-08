import { Message } from "./types.js";

export type EnvironmentalSeverity = "low" | "medium" | "high" | "critical";

export interface EnvironmentalEvent {
  source: string;
  type: string;
  severity: EnvironmentalSeverity;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface EnvironmentalContextPayload {
  isDegraded: boolean;
  primaryRisk: string;
  weightedScore: number;
  summary: string;
}

export class EnvironmentalContextStreamProcessor {
  private events: EnvironmentalEvent[] = [];

  constructor() {}

  public addEvent(event: EnvironmentalEvent): void {
    this.events.push(event);
  }

  public processStream(): void {
    this.events = this.events.filter(event => {
      return this.isRelevant(event);
    });
  }

  private isRelevant(event: EnvironmentalEvent): boolean {
    const { severity, type } = event;
    if (severity === "low" && type === "noise") {
      return false;
    }
    return true;
  }

  private calculateWeight(event: EnvironmentalEvent): number {
    const severityWeight: Record<EnvironmentalSeverity, number> = {
      "low": 1,
      "medium": 3,
      "high": 7,
      "critical": 10,
    };

    const recencyFactor = Math.exp(-(Date.now() - event.timestamp) / 3600000); // Decay over 1 hour
    return severityWeight[event.severity] * recencyFactor;
  }

  public getEnvironmentalContextPayload(): EnvironmentalContextPayload {
    if (this.events.length === 0) {
      return {
        isDegraded: false,
        primaryRisk: "None",
        weightedScore: 0,
        summary: "Operational environment appears stable.",
      };
    }

    let totalWeightedScore = 0;
    let primaryRisk: string = "Unknown";
    const riskMap: Record<string, number> = {};

    for (const event of this.events) {
      const weight = this.calculateWeight(event);
      totalWeightedScore += weight;

      const riskKey = `${event.type}:${event.source}`;
      riskMap[riskKey] = (riskMap[riskKey] || 0) + weight;

      if (weight > 5 && !primaryRisk) {
        primaryRisk = event.type;
      }
    }

    const isDegraded = totalWeightedScore > 15;
    const summary = `Processed ${this.events.length} events. Total weighted score: ${totalWeightedScore.toFixed(2)}. Primary focus: ${primaryRisk}.`;

    return {
      isDegraded: isDegraded,
      primaryRisk: primaryRisk,
      weightedScore: totalWeightedScore,
      summary: summary,
    };
  }
}