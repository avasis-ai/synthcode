import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface Capability {
  inputs: Record<string, { description: string; required: boolean }>;
  outputs: { schema: any; description: string };
  sideEffects: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  capability: Capability;
  execute: (input: Record<string, unknown>) => Promise<any>;
}

export class CapabilityRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  registerTool(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Checks if a sequence of tool calls is theoretically capable of achieving a goal.
   * @param requiredCapabilities A map of required capabilities (e.g., { "read_user_data": { schema: {}, description: "" } }).
   * @param confidenceThreshold Minimum required confidence score.
   * @returns An object containing the confidence score and a list of missing capabilities.
   */
  checkGoalFeasibility(
    requiredCapabilities: Record<string, { schema: any; description: string }>,
    confidenceThreshold: number = 0.7
  ): { confidenceScore: number; missingCapabilities: string[] } {
    let satisfiedCapabilities: Set<string> = new Set<string>();
    let totalRequiredCount = Object.keys(requiredCapabilities).length;
    let satisfiedCount = 0;

    for (const tool of this.tools.values()) {
      const cap = tool.capability;

      // Simple check: If the tool's defined capabilities cover any required capability name
      // In a real system, this would involve complex schema matching or capability tagging.
      if (Object.keys(cap.inputs).some(inputName => requiredCapabilities[inputName])) {
        // Simulate finding a match based on input names matching required goal components
        for (const requiredName of Object.keys(requiredCapabilities)) {
          if (cap.inputs[requiredName] && requiredCapabilities[requiredName]) {
            if (!satisfiedCapabilities.has(requiredName)) {
              satisfiedCapabilities.add(requiredName);
              satisfiedCount++;
            }
          }
        }
      }
    }

    const confidenceScore = satisfiedCount / totalRequiredCount;
    const missingCapabilities: string[] = [];

    for (const requiredName of Object.keys(requiredCapabilities)) {
      if (!satisfiedCapabilities.has(requiredName)) {
        missingCapabilities.push(requiredName);
      }
    }

    return {
      confidenceScore: Math.min(1.0, confidenceScore),
      missingCapabilities: missingCapabilities,
    };
  }
}