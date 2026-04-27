import { Message, ToolResultMessage } from "./types";

interface FieldMetrics {
  presentCount: number;
  typeCounts: Record<string, number>;
  nullCount: number;
}

interface SchemaMetrics {
  [key: string]: FieldMetrics;
}

interface DriftReport {
  schema: SchemaMetrics;
  driftScore: number;
  isDrifting: boolean;
  details: Record<string, {
    fieldName: string;
    deviation: number;
    reason: string;
  }>;
}

export class ToolOutputSchemaDriftMonitor {
  private readonly expectedSchema: Record<string, { type: string; required: boolean }>;
  private readonly history: {
    schema: Record<string, any>;
    timestamp: number;
  }[];
  private readonly maxHistorySize: number;
  private readonly driftThreshold: number;

  constructor(
    expectedSchema: Record<string, { type: string; required: boolean; }),
    maxHistorySize: number = 10,
    driftThreshold: number = 0.2
  ) {
    this.expectedSchema = expectedSchema;
    this.history = [];
    this.maxHistorySize = maxHistorySize;
    this.driftThreshold = driftThreshold;
  }

  private calculateMetrics(sampleOutputs: ToolResultMessage[]): SchemaMetrics {
    const metrics: Record<string, FieldMetrics> = {};

    for (const key in this.expectedSchema) {
      const fieldName = key;
      metrics[fieldName] = {
        presentCount: 0,
        typeCounts: {},
        nullCount: 0,
      };
    }

    for (const output of sampleOutputs) {
      for (const key in this.expectedSchema) {
        if (Object.prototype.hasOwnProperty.call(output, key)) {
          const value = (output as any)[key];
          const fieldMetrics = metrics[key];

          if (value !== undefined && value !== null) {
            fieldMetrics.presentCount++;
            const actualType = typeof value;
            fieldMetrics.typeCounts[actualType] = (fieldMetrics.typeCounts[actualType] || 0) + 1;
          } else {
            fieldMetrics.nullCount++;
          }
        }
      }
    }
    return metrics;
  }

  private generateDriftReport(currentMetrics: SchemaMetrics): DriftReport {
    const report: Record<string, {
      fieldName: string;
      deviation: number;
      reason: string;
    }> = {};
    let totalDeviation = 0;
    let fieldCount = 0;

    for (const key in this.expectedSchema) {
      const fieldMetrics = currentMetrics[key];
      fieldCount++;

      const expectedType = this.expectedSchema[key].type;
      const actualTypeConsistency = Object.keys(fieldMetrics.typeCounts).length > 1;
      const nullabilityDeviation = fieldMetrics.nullCount / Math.max(1, fieldMetrics.presentCount);

      let deviationScore = 0;
      let reason = "";

      if (actualTypeConsistency) {
        deviationScore += 0.3;
        reason += "Type inconsistency detected. ";
      }

      if (fieldMetrics.presentCount === 0) {
        deviationScore += 0.5;
        reason += "Field never present. ";
      } else if (nullabilityDeviation > 0.3 && this.expectedSchema[key].required) {
        deviationScore += 0.2;
        reason += "High null rate for required field. ";
      }

      if (deviationScore > 0) {
        report[key] = {
          fieldName: key,
          deviation: deviationScore,
          reason: reason.trim(),
        };
        totalDeviation += deviationScore;
      }
    }

    const averageDeviation = totalDeviation / Math.max(1, fieldCount);
    const isDrifting = averageDeviation > this.driftThreshold;

    return {
      schema: currentMetrics,
      driftScore: averageDeviation,
      isDrifting: isDrifting,
      details: report,
    };
  }

  public monitor(sampleOutputs: ToolResultMessage[]): DriftReport {
    if (sampleOutputs.length === 0) {
      return {
        schema: {} as SchemaMetrics,
        driftScore: 0,
        isDrifting: false,
        details: {},
      };
    }

    const currentMetrics = this.calculateMetrics(sampleOutputs);
    const report = this.generateDriftReport(currentMetrics);

    this.history.push({
      schema: currentMetrics,
      timestamp: Date.now(),
    });

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    return report;
  }
}