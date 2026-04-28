import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface Capability {
  name: string;
  description: string;
}

export interface ToolCapability {
  toolName: string;
  capabilities: Capability[];
  requiredContext: {
    type: string;
    schema?: Record<string, any>;
  };
  outputSchema: Record<string, any>;
}

export interface CompatibilityReport {
  isCompatible: boolean;
  conflicts: {
    toolA: string;
    toolB: string;
    conflictType: "ContextConflict" | "SchemaConflict" | "UnknownConflict";
    message: string;
  }[];
}

export class CompatibilityMatrix {
  private tools: ToolCapability[];

  constructor(tools: ToolCapability[]) {
    this.tools = tools;
  }

  private checkContextConflict(toolA: ToolCapability, toolB: ToolCapability): boolean {
    const contextA = toolA.requiredContext;
    const contextB = toolB.requiredContext;

    if (!contextA.type || !contextB.type) {
      return false;
    }

    // Simple conflict detection: if types are explicitly marked as mutually exclusive
    // For this implementation, we'll assume a conflict if they require different, non-overlapping types.
    // In a real system, this would involve a complex type system check.
    if (contextA.type !== contextB.type) {
      return true;
    }
    return false;
  }

  private checkSchemaConflict(toolA: ToolCapability, toolB: ToolCapability): boolean {
    const schemaA = toolA.outputSchema;
    const schemaB = toolB.outputSchema;

    // Simple conflict detection: if they both define a field with the same name
    // but different expected types (highly simplified check).
    const keysA = Object.keys(schemaA);
    const keysB = Object.keys(schemaB);

    for (const key of keysA) {
      if (keysB.includes(key)) {
        // In a real scenario, we'd compare types deeply. Here, we just flag any shared key.
        return true;
      }
    }
    return false;
  }

  public generateReport(toolNames: string[]): CompatibilityReport {
    const selectedTools: ToolCapability[] = this.tools.filter(
      (tool) => toolNames.includes(tool.toolName)
    );

    const conflicts: {
      toolA: string;
      toolB: string;
      conflictType: "ContextConflict" | "SchemaConflict" | "UnknownConflict";
      message: string;
    }[] = [];

    for (let i = 0; i < selectedTools.length; i++) {
      for (let j = i + 1; j < selectedTools.length; j++) {
        const toolA = selectedTools[i];
        const toolB = selectedTools[j];

        // Check Context Conflict
        if (this.checkContextConflict(toolA, toolB)) {
          conflicts.push({
            toolA: toolA.toolName,
            toolB: toolB.toolName,
            conflictType: "ContextConflict",
            message: `Requires mutually exclusive context states: ${toolA.requiredContext.type} vs ${toolB.requiredContext.type}.`,
          });
        }

        // Check Schema Conflict
        if (this.checkSchemaConflict(toolA, toolB)) {
          conflicts.push({
            toolA: toolA.toolName,
            toolB: toolB.toolName,
            conflictType: "SchemaConflict",
            message: "Output schemas overlap, potentially causing data loss or ambiguity.",
          });
        }
      }
    }

    return {
      isCompatible: conflicts.length === 0,
      conflicts: conflicts,
    };
  }
}

export function checkCompatibility(
  tools: ToolCapability[],
  toolNames: string[]
): CompatibilityReport {
  const matrix = new CompatibilityMatrix(tools);
  return matrix.generateReport(toolNames);
}