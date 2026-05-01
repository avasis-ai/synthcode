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

export interface FieldSchema {
  type: string;
  description: string;
  required?: boolean;
  enum?: Record<string, string>;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, FieldSchema>;
}

export interface DownstreamToolDefinitions {
  [toolName: string]: {
    schema: ToolSchema;
    constraints: {
      [key: string]: {
        type: string;
        impact: "breaking" | "warning" | "none";
      };
    };
  };
}

export interface StructuralDiff {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: "added" | "removed" | "modified";
}

export type SemanticImpact = "breaking" | "warning" | "none";

export interface SemanticImpactReport {
  impact: SemanticImpact;
  reason: string;
  affectedFields: {
    path: string;
    oldType: string;
    newType: string;
    impact: SemanticImpact;
  }[];
}

export interface SchemaDiffReport {
  structuralDiff: StructuralDiff[];
  semanticImpactReport: SemanticImpactReport;
}

export class SchemaDiffingEngine {
  private downstreamTools: DownstreamToolDefinitions;

  constructor(downstreamTools: DownstreamToolDefinitions) {
    this.downstreamTools = downstreamTools;
  }

  private analyzeFieldChange(
    oldSchema: FieldSchema,
    newSchema: FieldSchema,
    path: string
  ): {
    impact: SemanticImpact;
    reason: string;
    affectedFields: {
      path: string;
      oldType: string;
      newType: string;
      impact: SemanticImpact;
    }[];
  } {
    const affectedFields: {
      path: string;
      oldType: string;
      newType: string;
      impact: SemanticImpact;
    }[] = [];
    let overallImpact: SemanticImpact = "none";

    if (oldSchema.required !== undefined && !newSchema.required) {
      affectedFields.push({
        path: path,
        oldType: oldSchema.type,
        newType: newSchema.type,
        impact: "warning",
      });
      overallImpact = "warning";
    }

    if (oldSchema.type !== newSchema.type) {
      affectedFields.push({
        path: path,
        oldType: oldSchema.type,
        newType: newSchema.type,
        impact: "breaking",
      });
      overallImpact = "breaking";
    }

    if (oldSchema.enum && !newSchema.enum) {
      affectedFields.push({
        path: path,
        oldType: oldSchema.type,
        newType: newSchema.type,
        impact: "warning",
      });
      overallImpact = "warning";
    }

    return {
      impact: overallImpact,
      reason: `Field ${path} changed type or required status.`,
      affectedFields,
    };
  }

  private analyzeToolSchemaChange(
    oldToolSchema: ToolSchema,
    newToolSchema: ToolSchema,
    toolName: string
  ): {
    impact: SemanticImpact;
    reason: string;
    affectedFields: {
      path: string;
      oldType: string;
      newType: string;
      impact: SemanticImpact;
    }[];
  } {
    const affectedFields: {
      path: string;
      oldType: string;
      newType: string;
      impact: SemanticImpact;
    }[] = [];
    let overallImpact: SemanticImpact = "none";

    const oldParams = oldToolSchema.parameters;
    const newParams = newToolSchema.parameters;

    for (const key in newParams) {
      const newField = newParams[key];
      const oldField = oldParams[key];

      if (!oldField) {
        affectedFields.push({
          path: `parameters.${key}`,
          oldType: "N/A",
          newType: newField.type,
          impact: "warning",
        });
        overallImpact = "warning";
        continue;
      }

      const fieldAnalysis = this.analyzeFieldChange(
        oldField,
        newField,
        `parameters.${key}`
      );
      affectedFields.push(...fieldAnalysis.affectedFields);
      if (fieldAnalysis.impact === "breaking") {
        overallImpact = "breaking";
      } else if (fieldAnalysis.impact === "warning" && overallImpact === "none") {
        overallImpact = "warning";
      }
    }

    return {
      impact: overallImpact,
      reason: `Tool ${toolName} parameters changed.`,
      affectedFields,
    };
  }

  public diffSchemas(
    oldSchema: Record<string, any>,
    newSchema: Record<string, any>
  ): SchemaDiffReport {
    const structuralDiff: StructuralDiff[] = [];
    const semanticImpacts: {
      impact: SemanticImpact;
      reason: string;
      affectedFields: {
        path: string;
        oldType: string;
        newType: string;
        impact: SemanticImpact;
      }[];
    }[] = [];

    // 1. Structural Diffing (Simplified for demonstration)
    // In a real scenario, this would recursively compare JSON structures.
    if (typeof oldSchema !== typeof newSchema) {
      structuralDiff.push({
        path: "root",
        oldValue: typeof oldSchema,
        newValue: typeof newSchema,
        changeType: "modified",
      });
    } else if (JSON.stringify(oldSchema) !== JSON.stringify(newSchema)) {
      structuralDiff.push({
        path: "root",
        oldValue: "object",
        newValue: "object",
        changeType: "modified",
      });
    }

    // 2. Semantic Impact Analysis (Focusing on Tool Definitions)
    let overallSemanticImpact: SemanticImpact = "none";
    const allSemanticReports: SemanticImpactReport[] = [];

    for (const toolName in this.downstreamTools) {
      const oldTool = this.downstreamTools[toolName];
      // Mocking the retrieval of the 'new' tool definition for comparison
      // In reality, 'newSchema' would contain the updated tool definitions.
      const newTool = {
        name: toolName,
        description: "Updated description",
        parameters: {
          id: { type: "string", description: "ID", required: true },
          value: { type: "number", description: "Value", required: false },
        },
      } as ToolSchema;

      const toolImpact = this.analyzeToolSchemaChange(
        oldTool.schema,
        newTool.schema,
        toolName
      );

      const report: SemanticImpactReport = {
        impact: toolImpact.impact,
        reason: toolImpact.reason,
        affectedFields: toolImpact.affectedFields,
      };
      allSemanticReports.push(report);
      if (toolImpact.impact === "breaking") {
        overallSemanticImpact = "breaking";
      } else if (toolImpact.impact === "warning" && overallSemanticImpact === "none") {
        overallSemanticImpact = "warning";
      }
    }

    // Aggregate semantic report (taking the highest impact)
    const finalSemanticReport: SemanticImpactReport = {
      impact: overallSemanticImpact,
      reason: "Combined analysis of all tool definitions.",
      affectedFields: allSemanticReports.flatMap(r => r.affectedFields),
    };

    return {
      structuralDiff,
      semanticImpactReport: finalSemanticReport,
    };
  }
}

export const createSchemaDiffingEngine = (
  downstreamTools: DownstreamToolDefinitions
): SchemaDiffingEngine => {
  return new SchemaDiffingEngine(downstreamTools);
};