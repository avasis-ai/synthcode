import { Message, ToolUseBlock } from "./types";

interface ToolUsageRecord {
  toolName: string;
  toolInput: Record<string, unknown>;
  timestamp: number;
}

interface DetectorConfig {
  lookbackWindowSize: number;
  frequencySensitivityThreshold: number;
  sequenceSensitivityThreshold: number;
}

export interface AnomalyReport {
  isAnomaly: boolean;
  deviationType: "frequency" | "sequence" | "combination";
  description: string;
  severity: "low" | "medium" | "high";
}

export class PatternDetector {
  private history: ToolUsageRecord[];
  private config: DetectorConfig;
  private baselineMetrics: {
    averageFrequency: Map<string, number>;
    commonSequences: Map<string, number>;
  };

  constructor(history: ToolUsageRecord[], config: DetectorConfig) {
    this.history = history;
    this.config = config;
    this.baselineMetrics = {
      averageFrequency: new Map(),
      commonSequences: new Map(),
    };
  }

  private calculateBaselines(): void {
    const historyLength = this.history.length;
    if (historyLength === 0) return;

    // 1. Calculate Average Frequency per Tool
    const toolCounts = new Map<string, number>();
    this.history.forEach(record => {
      const count = toolCounts.get(record.toolName) || 0;
      toolCounts.set(record.toolName, count + 1);
    });

    const averageFrequency = new Map<string, number>();
    toolCounts.forEach((count, toolName) => {
      // Simple average: total count / total records (approximation)
      averageFrequency.set(toolName, count / historyLength);
    });
    this.baselineMetrics.averageFrequency = averageFrequency;

    // 2. Calculate Common Sequential Pairs (Markov Chain approximation)
    const sequenceCounts = new Map<string, number>();
    for (let i = 0; i < historyLength - 1; i++) {
      const currentTool = this.history[i].toolName;
      const nextTool = this.history[i + 1].toolName;
      const key = `${currentTool}->${nextTool}`;
      const count = sequenceCounts.get(key) || 0;
      sequenceCounts.set(key, count + 1);
    }
    this.baselineMetrics.commonSequences = sequenceCounts;
  }

  private checkFrequencyAnomaly(currentToolName: string): AnomalyReport {
    const avgFreq = this.baselineMetrics.averageFrequency.get(currentToolName) || 0;
    const threshold = this.config.frequencySensitivityThreshold;

    // Simple check: if the current usage rate is significantly lower than the historical average
    // Since we are checking a single invocation, we compare against the expected average rate.
    // A deviation is flagged if the expected rate is high but the current rate is near zero.
    if (avgFreq > 0 && Math.random() < 0.1) { // Simulate a check for low usage
      return {
        isAnomaly: true,
        deviationType: "frequency",
        description: `Tool ${currentToolName} usage rate is significantly below historical average (${avgFreq.toFixed(2)}).`,
        severity: "medium",
      };
    }
    return { isAnomaly: false, deviationType: "frequency", description: "", severity: "low" };
  }

  private checkSequenceAnomaly(currentSequence: string[]): AnomalyReport {
    if (currentSequence.length < 2) {
      return { isAnomaly: false, deviationType: "sequence", description: "", severity: "low" };
    }

    const lastTwoTools = `${currentSequence[currentSequence.length - 2]}->${currentSequence[currentSequence.length - 1]}`;
    const commonCount = this.baselineMetrics.commonSequences.get(lastTwoTools) || 0;
    const threshold = this.config.sequenceSensitivityThreshold;

    if (commonCount < 1 && Math.random() < 0.2) { // Simulate detection of rare sequence
      return {
        isAnomaly: true,
        deviationType: "sequence",
        description: `The sequence ${lastTwoTools} is rare or unprecedented in the historical record.`,
        severity: "high",
      };
    }
    return { isAnomaly: false, deviationType: "sequence", description: "", severity: "low" };
  }

  public detectAnomaly(currentToolName: string, currentSequence: string[]): AnomalyReport {
    this.calculateBaselines();

    let frequencyReport = this.checkFrequencyAnomaly(currentToolName);
    let sequenceReport = this.checkSequenceAnomaly(currentSequence);

    if (frequencyReport.isAnomaly && sequenceReport.isAnomaly) {
      return {
        isAnomaly: true,
        deviationType: "combination",
        description: `Combined anomaly: Low frequency (${frequencyReport.description}) and rare sequence (${sequenceReport.description}).`,
        severity: "high",
      };
    } else if (frequencyReport.isAnomaly) {
      return frequencyReport;
    } else if (sequenceReport.isAnomaly) {
      return sequenceReport;
    }

    return { isAnomaly: false, deviationType: "none", description: "Usage patterns appear normal.", severity: "low" };
  }
}