import {
  ToolResultMessage,
  Message,
} from "./message-types";

export interface FieldSchema {
  type: string;
  required: boolean;
}

export interface Schema {
  [key: string]: FieldSchema;
}

export interface SchemaEvolutionReport {
  toolName: string;
  initialSchema: Schema;
  history: {
    timestamp: number;
    schema: Schema;
    deviationScore: number;
    reportDetails: string;
  }[];
  suggestedActions: string[];
}

export class SchemaEvolutionTracker {
  private toolName: string;
  private history: {
    timestamp: number;
    schema: Schema;
    deviationScore: number;
    reportDetails: string;
  }[];
  private initialSchema: Schema;

  constructor(toolName: string, initialSchema: Schema) {
    this.toolName = toolName;
    this.initialSchema = initialSchema;
    this.history = [{
      timestamp: Date.now(),
      schema: initialSchema,
      deviationScore: 0,
      reportDetails: "Initial schema recorded.",
    }];
  }

  private calculateDeviationScore(
    currentSchema: Schema,
    previousSchema: Schema
  ): {
    score: number;
    details: string;
  } {
    let score = 0;
    let details = "";

    const currentFields = Object.keys(currentSchema);
    const previousFields = Object.keys(previousSchema);

    // Check for removals and type changes
    for (const field of previousFields) {
      if (!currentSchema[field]) {
        details += `[DEPRECATED] Field '${field}' removed. `;
        score += 1;
      } else {
        const prev = previousSchema[field];
        const curr = currentSchema[field];
        if (prev.type !== curr.type) {
          details += `[TYPE CHANGE] Field '${field}' changed from ${prev.type} to ${curr.type}. `;
          score += 0.5;
        } else if (prev.required && !curr.required) {
          details += `[OPTIONALITY CHANGE] Field '${field}' changed from required to optional. `;
          score += 0.2;
        }
      }
    }

    // Check for additions
    for (const field of currentFields) {
      if (!previousSchema[field]) {
        details += `[ADDED] Field '${field}' added. `;
        score += 0.1;
      }
    }

    return { score, details };
  }

  public recordNewSchema(newSchema: Schema): SchemaEvolutionReport {
    const previousSchema = this.history[this.history.length - 1].schema;
    const { score: deviationScore, details: changeDetails } =
      this.calculateDeviationScore(newSchema, previousSchema);

    const reportDetails = `${changeDetails}Schema deviation score: ${deviationScore.toFixed(1)}.`;

    this.history.push({
      timestamp: Date.now(),
      schema: newSchema,
      deviationScore: deviationScore,
      reportDetails: reportDetails,
    });

    const suggestedActions = this.generateSuggestedActions(
      newSchema,
      previousSchema,
      deviationScore
    );

    return {
      toolName: this.toolName,
      initialSchema: this.initialSchema,
      history: [...this.history],
      suggestedActions: suggestedActions,
    };
  }

  private generateSuggestedActions(
    currentSchema: Schema,
    previousSchema: Schema,
    deviationScore: number
  ): string[] {
    const actions: string[] = [];

    if (deviationScore > 1.0) {
      actions.push(
        "High deviation detected. Review all removed/changed fields immediately. Potential breaking change."
      );
    } else if (deviationScore > 0.5) {
      actions.push(
        "Moderate deviation. Review type changes or removals of required fields. Consumers might need updates."
      );
    } else if (deviationScore > 0) {
      actions.push(
        "Minor evolution detected. Consider updating documentation for new optional fields."
      );
    } else {
      actions.push("Schema appears stable. No immediate action required.");
    }

    return actions;
  }
}

export { SchemaEvolutionTracker };