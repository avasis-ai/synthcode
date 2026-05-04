import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

interface ResourceConstraint {
  resourceName: string;
  requiredAmount: number;
  availableAmount: number;
}

interface TemporalConstraint {
  minDelaySeconds: number;
  maxDelaySeconds: number;
}

export interface AdvancedToolCallContext {
  history: Message[];
  currentResources: Map<string, number>;
  resourceConstraints: ResourceConstraint[];
  temporalConstraints: TemporalConstraint[];
  lastToolCallOutput: Record<string, unknown> | null;
}

export class ContextualToolCallValidatorAdvancedAdvanced {
  private context: AdvancedToolCallContext;

  constructor(context: AdvancedToolCallContext) {
    this.context = context;
  }

  private checkResourceAvailability(toolName: string, requiredResources: Record<string, number>): boolean {
    for (const [resource, required] of Object.entries(requiredResources)) {
      const available = this.context.currentResources.get(resource) || 0;
      if (available < required) {
        return false;
      }
    }
    return true;
  }

  private checkTemporalFlow(toolName: string, requiredDelay: number): boolean {
    if (this.context.temporalConstraints.length === 0) {
      return true;
    }
    const lastToolCall = this.context.history.filter(m => m.role === "tool")
      .pop() as ToolResultMessage | undefined;

    if (!lastToolCall) {
      return true;
    }

    // Simplified check: assume requiredDelay is the minimum delay needed after the last tool call
    const minDelay = this.context.temporalConstraints.reduce(
      (acc, tc) => acc > tc.minDelaySeconds ? acc : tc.minDelaySeconds,
      0
    );

    // In a real system, we'd compare timestamps. Here, we just check if the required delay is plausible.
    return requiredDelay >= minDelay * 0.9;
  }

  private checkPrerequisites(toolName: string, requiredPrerequisites: string[]): boolean {
    if (requiredPrerequisites.length === 0) {
      return true;
    }

    const historyToolOutputs = this.context.history
      .filter(m => m.role === "tool")
      .map((m) => m as ToolResultMessage);

    for (const prereq of requiredPrerequisites) {
      let found = false;
      for (const output of historyToolOutputs) {
        if (output.content.includes(prereq)) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  }

  public validate(proposedToolCalls: { name: string; input: Record<string, unknown> }[]): { isValid: boolean; reason: string } {
    if (!proposedToolCalls || proposedToolCalls.length === 0) {
      return { isValid: true, reason: "No calls proposed." };
    }

    for (let i = 0; i < proposedToolCalls.length; i++) {
      const call = proposedToolCalls[i];
      const toolName = call.name;
      const input = call.input;

      // Mocking complex dependency checks based on tool name/input structure
      const requiredResources: Record<string, number> = this.getMockResourceRequirements(toolName, input);
      const requiredPrereqs: string[] = this.getMockPrerequisites(toolName);
      const requiredDelay: number = this.getMockTemporalRequirement(toolName);

      // 1. Resource Check
      if (!this.checkResourceAvailability(toolName, requiredResources)) {
        return { isValid: false, reason: `Resource constraint violation for ${toolName}. Insufficient resources.` };
      }

      // 2. Prerequisite Check
      if (!this.checkPrerequisites(toolName, requiredPrereqs)) {
        return { isValid: false, reason: `Logical prerequisite failure for ${toolName}. Required context missing.` };
      }

      // 3. Temporal Check
      if (!this.checkTemporalFlow(toolName, requiredDelay)) {
        return { isValid: false, reason: `Temporal flow violation for ${toolName}. Must wait longer after previous steps.` };
      }
    }

    return { isValid: true, reason: "Tool call sequence appears logically sound based on current context." };
  }

  private getMockResourceRequirements(toolName: string, input: Record<string, unknown>): Record<string, number> {
    if (toolName === "database_write" && typeof input.data === 'object' && input.data) {
      return { "db_connection": 1, "write_quota": 10 };
    }
    return {};
  }

  private getMockPrerequisites(toolName: string): string[] {
    if (toolName === "summarize_document") {
      return ["document_id_123"];
    }
    return [];
  }

  private getMockTemporalRequirement(toolName: string): number {
    if (toolName === "api_call_external") {
      return 5; // Must wait at least 5 seconds
    }
    return 0;
  }
}