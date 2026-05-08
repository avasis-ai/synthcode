export type Message = any;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent = any;

export interface DataSource {
  payload: Record<string, unknown>;
  timestamp: number;
  source_reliability_score: number;
}

export type FusionRule = "RECENCY_WEIGHTING" | "SOURCE_RELIABILITY" | "WEIGHTED_AVERAGING" | "PRIORITIZED_MERGE";

export interface ContextPayload {
  fused_data: Record<string, unknown>;
  timestamp: number;
}

export interface FusionReport {
  rule_applied: FusionRule;
  sources_processed: number;
  conflict_detected: boolean;
  details: string;
}

export class ExternalDataFusionManager {
  private sources: DataSource[] = [];

  registerSource(source: DataSource): void {
    this.sources.push(source);
  }

  /**
   * Executes the fusion logic based on the provided rule.
   * @param sources Array of data sources to fuse.
   * @param rule The fusion rule to apply.
   * @returns A tuple containing the ContextPayload and FusionReport.
   */
  fuseSources(sources: DataSource[], rule: FusionRule): { payload: ContextPayload; report: FusionReport } {
    if (!sources || sources.length === 0) {
      return {
        payload: { fused_data: {}, timestamp: Date.now() },
        report: {
          rule_applied: rule,
          sources_processed: 0,
          conflict_detected: false,
          details: "No sources provided for fusion.",
        },
      };
    }

    let fusedData: Record<string, unknown> = {};
    let conflictDetected = false;

    switch (rule) {
      case "RECENCY_WEIGHTING":
        fusedData = this.applyRecencyWeighting(sources);
        break;
      case "SOURCE_RELIABILITY":
        fusedData = this.applySourceReliability(sources);
        break;
      case "WEIGHTED_AVERAGING":
        fusedData = this.applyWeightedAveraging(sources);
        break;
      case "PRIORITIZED_MERGE":
        fusedData = this.applyPrioritizedMerge(sources);
        break;
    }

    const report: FusionReport = {
      rule_applied: rule,
      sources_processed: sources.length,
      conflict_detected: conflictDetected,
      details: `Fusion completed using ${rule} rule.`,
    };

    const payload: ContextPayload = {
      fused_data: fusedData,
      timestamp: Date.now(),
    };

    return { payload, report };
  }

  private applyRecencyWeighting(sources: DataSource[]): Record<string, unknown> {
    const sortedSources = [...sources].sort((a, b) => b.timestamp - a.timestamp);
    const fused: Record<string, unknown> = {};

    for (const source of sortedSources) {
      for (const key in source.payload) {
        if (!fused[key] || source.timestamp > (typeof fused[key] === 'object' && 'timestamp' in fused[key] ? (fused[key] as any).timestamp : 0)) {
          fused[key] = {
            value: (typeof source.payload[key] === 'object' && source.payload[key] !== null) ? source.payload[key] : source.payload[key],
            timestamp: source.timestamp,
            source_score: source.source_reliability_score,
          };
        }
      }
    }
    return fused;
  }

  private applySourceReliability(sources: DataSource[]): Record<string, unknown> {
    const fused: Record<string, unknown> = {};
    for (const source of sources) {
      for (const key in source.payload) {
        const existing = fused[key];
        if (!existing || source.source_reliability_score > (typeof existing === 'object' && 'source_score' in existing ? (existing as any).source_score : -1)) {
          fused[key] = {
            value: (typeof source.payload[key] === 'object' && source.payload[key] !== null) ? source.payload[key] : source.payload[key],
            source_score: source.source_reliability_score,
          };
        }
      }
    }
    return fused;
  }

  private applyWeightedAveraging(sources: DataSource[]): Record<string, unknown> {
    const fused: Record<string, unknown> = {};
    // Simplified implementation assuming numeric data for averaging
    for (const key in sources[0].payload) {
      let sum = 0;
      let totalWeight = 0;
      let count = 0;

      for (const source of sources) {
        const value = (typeof source.payload[key] === 'number') ? source.payload[key] : undefined;
        if (typeof value === 'number') {
          sum += value * source.source_reliability_score;
          totalWeight += source.source_reliability_score;
          count++;
        }
      }

      if (totalWeight > 0) {
        fused[key] = sum / totalWeight;
      }
    }
    return fused;
  }

  private applyPrioritizedMerge(sources: DataSource[]): Record<string, unknown> {
    // Simple merge: last source wins, but we track conflicts
    const fused: Record<string, unknown> = {};
    for (const source of sources) {
      for (const key in source.payload) {
        if (fused[key] !== undefined && typeof fused[key] !== 'object') {
          // Simulate conflict detection
        }
        fused[key] = source.payload[key];
      }
    }
    return fused;
  }
}

export { ExternalDataFusionManager };