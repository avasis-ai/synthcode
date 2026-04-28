import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface SchemaField {
  name: string;
  type: string;
  isRequired: boolean;
}

interface Schema {
  [key: string]: SchemaField | any;
}

interface SchemaHistory {
  schemas: Schema[];
  count: number;
}

interface EvolutionReport {
  driftDetected: boolean;
  severity: "None" | "Minor" | "Moderate" | "Severe";
  details: string[];
}

class ToolOutputSchemaEvolutionMonitor {
  private history: SchemaHistory;
  private readonly historySize: number;

  constructor(historySize: number = 100) {
    this.history = { schemas: [], count: 0 };
    this.historySize = historySize;
  }

  private getSchemaFromToolResult(result: ToolResultMessage): Schema | null {
    if (!result.content) {
      return null;
    }
    // Simplified schema extraction: assumes content is JSON string representation of an object
    try {
      const data = JSON.parse(result.content);
      if (typeof data !== "object" || data === null) {
        return null;
      }
      // In a real scenario, we'd use a JSON Schema library here.
      // For this simulation, we'll just return a placeholder schema based on keys.
      const schema: Partial<Record<string, SchemaField>> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          schema[key] = { name: key, type: typeof data[key] === 'object' && data[key] !== null ? 'object' : typeof data[key], isRequired: true };
        }
      }
      return schema as Schema;
    } catch (e) {
      return null;
    }
  }

  public recordSchema(toolResult: ToolResultMessage): void {
    const schema = this.getSchemaFromToolResult(toolResult);
    if (schema) {
      this.history.schemas.push(schema);
      this.history.count++;
      if (this.history.schemas.length > this.historySize) {
        this.history.schemas.shift();
        this.history.count--;
      }
    }
  }

  private calculateSchemaSimilarity(currentSchema: Schema, historicalSchema: Schema): number {
    let matches = 0;
    let totalFields = 0;

    const currentKeys = Object.keys(currentSchema);
    const historicalKeys = Object.keys(historicalSchema);

    // Check for matching fields and type consistency
    for (const key of currentKeys) {
      const currentField = currentSchema[key] as SchemaField;
      const historicalField = historicalSchema[key] as SchemaField;

      if (historicalField) {
        if (currentField.type === historicalField.type && currentField.isRequired === historicalField.isRequired) {
          matches++;
        }
      }
      totalFields++;
    }

    // Simple metric: proportion of matching fields
    return matches / Math.max(1, totalFields);
  }

  public generateEvolutionReport(currentToolResult: ToolResultMessage): EvolutionReport {
    const currentSchema = this.getSchemaFromToolResult(currentToolResult);
    if (!currentSchema || this.history.schemas.length < 5) {
      return {
        driftDetected: false,
        severity: "None",
        details: ["Insufficient history to detect drift."],
      };
    }

    let totalSimilarityScore = 0;
    let comparisonCount = 0;
    const deviationDetails: string[] = [];

    for (const historicalSchema of this.history.schemas) {
      const similarity = this.calculateSchemaSimilarity(currentSchema, historicalSchema);
      totalSimilarityScore += similarity;
      comparisonCount++;
    }

    const averageSimilarity = totalSimilarityScore / comparisonCount;
    const driftDetected = averageSimilarity < 0.85; // Threshold for drift

    let severity: "None" | "Minor" | "Moderate" | "Severe" = "None";

    if (driftDetected) {
      if (averageSimilarity < 0.7) {
        severity = "Severe";
        deviationDetails.push("Significant structural drift detected. Multiple fields or types have changed substantially.");
      } else if (averageSimilarity < 0.8) {
        severity = "Moderate";
        deviationDetails.push("Moderate drift detected. Potential breaking changes in field types or required status.");
      } else {
        severity = "Minor";
        deviationDetails.push("Minor drift detected. Small deviations from historical norms.");
      }
    } else {
      deviationDetails.push(`Schema similarity to history (${averageSimilarity.toFixed(2)}) is within acceptable bounds.`);
    }

    return {
      driftDetected: driftDetected,
      severity: severity,
      details: deviationDetails,
    };
  }
}

export { ToolOutputSchemaEvolutionMonitor };