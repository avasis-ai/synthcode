import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface PolicyCandidate {
  id: string;
  description: string;
  // A function that encapsulates the policy logic (e.g., prompt generation, constraint application)
  executePolicy: (history: Message[], userPrompt: string) => Promise<{
    // Simulate the core agent interaction
    finalState: Message[];
    metrics: {
      cost: number;
      success: boolean;
      latencyMs: number;
      resourceUsage: number;
    };
  }>;
}

interface PolicyMetrics {
  cost: number;
  success: boolean;
  latencyMs: number;
  resourceUsage: number;
}

interface ComparisonResult {
  candidateId: string;
  metrics: PolicyMetrics;
  finalState: Message[];
}

export class PolicyComparisonEngine {
  private candidates: PolicyCandidate[];
  private results: ComparisonResult[] = [];

  constructor(candidates: PolicyCandidate[]) {
    this.candidates = candidates;
  }

  async runComparison(userPrompt: string): Promise<ComparisonResult[]> {
    this.results = [];
    for (const candidate of this.candidates) {
      const result = await candidate.executePolicy([], userPrompt);
      this.results.push({
        candidateId: candidate.id,
        metrics: result.metrics,
        finalState: result.finalState,
      });
    }
    return this.results;
  }

  generateReport(): {
    summary: Record<string, {
      meanCost: number;
      meanLatency: number;
      successRate: number;
      averageResourceUsage: number;
    }>;
    rankedPolicies: {
      id: string;
      score: number;
    }[];
  } {
    if (this.results.length === 0) {
      return {
        summary: {},
        rankedPolicies: [],
      };
    }

    const summary: Record<string, {
      meanCost: number;
      meanLatency: number;
      successRate: number;
      averageResourceUsage: number;
    }> = {};

    for (const result of this.results) {
      const metrics = result.metrics;
      const id = result.candidateId;

      if (!summary[id]) {
        summary[id] = {
          meanCost: 0,
          meanLatency: 0,
          successRate: 0,
          averageResourceUsage: 0,
        };
      }

      const current = summary[id];
      const count = Object.keys(summary).length + 1;

      current.meanCost += metrics.cost;
      current.meanLatency += metrics.latencyMs;
      current.averageResourceUsage += metrics.resourceUsage;
      if (metrics.success) {
        current.successRate += 1;
      }
    }

    const finalSummary: Record<string, {
      meanCost: number;
      meanLatency: number;
      successRate: number;
      averageResourceUsage: number;
    }> = {};

    for (const id in summary) {
      const metrics = summary[id];
      const count = this.results.filter(r => r.candidateId === id).length;

      finalSummary[id] = {
        meanCost: metrics.meanCost / count,
        meanLatency: metrics.meanLatency / count,
        successRate: metrics.successRate / count,
        averageResourceUsage: metrics.averageResourceUsage / count,
      };
    }

    const rankedPolicies = this.results.map((result) => {
      const metrics = result.metrics;
      const summaryMetrics = finalSummary[result.candidateId];

      // Simple weighted scoring: Success (high weight), Cost (negative weight), Latency (negative weight)
      // Weights are arbitrary for demonstration
      const score = (
        metrics.success ? 100 : 0
      ) - (
        summaryMetrics.meanCost * 5
      ) - (
        summaryMetrics.meanLatency * 0.01
      ) + (
        summaryMetrics.successRate * 50
      );

      return {
        id: result.candidateId,
        score: score,
      };
    }).sort((a, b) => b.score - a.score);

    return {
      summary: finalSummary,
      rankedPolicies,
    };
  }
}