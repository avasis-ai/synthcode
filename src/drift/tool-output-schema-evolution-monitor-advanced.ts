import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

interface SchemaHistoryEntry {
  timestamp: number;
  schema: Record<string, any>;
}

interface SchemaEvolutionMetrics {
  history: SchemaHistoryEntry[];
  schemaEvolutionVelocity: number;
  schemaEvolutionForecast: string;
}

export class ToolOutputSchemaEvolutionMonitorAdvanced {
  private toolName: string;
  private history: SchemaHistoryEntry[] = [];
  private readonly windowSize: number;

  constructor(toolName: string, windowSize: number = 5) {
    this.toolName = toolName;
    this.windowSize = windowSize;
  }

  private calculateSchemaDifference(oldSchema: Record<string, any>, newSchema: Record<string, any>): number {
    const keysOld = Object.keys(oldSchema);
    const keysNew = Object.keys(newSchema);

    let diffCount = 0;

    // Check for added/removed keys
    for (const key of keysNew) {
      if (!keysOld.includes(key)) {
        diffCount++;
      }
    }
    for (const key of keysOld) {
      if (!keysNew.includes(key)) {
        diffCount++;
      }
    }

    // Check for changed types/structures (simplified check)
    const commonKeys = new Set(keysOld.filter(key => keysNew.includes(key)));
    for (const key of commonKeys) {
      const oldType = typeof oldSchema[key];
      const newType = typeof newSchema[key];
      if (oldType !== newType) {
        diffCount++;
      }
    }

    return diffCount;
  }

  private calculateVelocity(metrics: SchemaEvolutionMetrics): number {
    if (metrics.history.length < 2) {
      return 0;
    }

    const recentHistory = metrics.history.slice(-Math.min(metrics.history.length, this.windowSize));
    let totalDiff = 0;
    let changeCount = 0;

    for (let i = 1; i < recentHistory.length; i++) {
      const oldSchema = recentHistory[i - 1].schema;
      const newSchema = recentHistory[i].schema;
      const diff = this.calculateSchemaDifference(oldSchema, newSchema);
      if (diff > 0) {
        totalDiff += diff;
        changeCount++;
      }
    }

    // Velocity = Total Schema Changes / Number of Observations (or a normalized rate)
    return changeCount > 0 ? totalDiff / changeCount : 0;
  }

  public recordSchema(schema: Record<string, any>): void {
    const entry: SchemaHistoryEntry = {
      timestamp: Date.now(),
      schema: schema,
    };

    this.history.push(entry);

    // Keep history manageable
    if (this.history.length > this.windowSize * 2) {
      this.history.shift();
    }
  }

  public generateReport(): SchemaEvolutionMetrics {
    const metrics: SchemaEvolutionMetrics = {
      history: [...this.history],
      schemaEvolutionVelocity: this.calculateVelocity(this),
      schemaEvolutionForecast: this.generateForecast(),
    };
    return metrics;
  }

  private generateForecast(): string {
    if (this.history.length < 2) {
      return "Insufficient data to forecast schema evolution.";
    }

    const metrics = this.generateReport();
    const velocity = metrics.schemaEvolutionVelocity;

    if (velocity > 2) {
      return "HIGH RISK: Rapid schema drift detected. Proactive version bumping (e.g., v1.0 -> v2.0) is strongly recommended to stabilize the contract.";
    } else if (velocity > 0) {
      return "MODERATE RISK: Consistent minor schema changes observed. Consider implementing schema versioning within the tool definition itself.";
    } else {
      return "LOW RISK: Schema appears stable over the recorded history. No immediate versioning action required.";
    }
  }
}