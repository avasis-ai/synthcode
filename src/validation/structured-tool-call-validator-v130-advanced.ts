import { ValidatorBase } from "./validator-base";

export type ToolCall = {
  name: string;
  input: Record<string, unknown>;
};

export interface Context {
  currentTime: Date;
  timeWindowStart: Date;
  timeWindowEnd: Date;
  availableResources: Record<string, { capacity: number; unit: string }>;
}

export class StructuredToolCallValidatorAdvanced extends ValidatorBase {
  constructor(private context: Context) {
    super();
  }

  validate(toolCall: ToolCall): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!toolCall.name || typeof toolCall.name !== 'string') {
      errors.push("Tool call must have a valid name.");
    }

    if (typeof toolCall.input !== 'object' || toolCall.input === null) {
      errors.push("Tool call must have a valid input object.");
    } else {
      this.validateToolCallInput(toolCall.input, errors);
    }

    this.validateTemporalConstraints(toolCall, errors);
    this.validateResourceConstraints(toolCall, errors);

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  private validateToolCallInput(input: Record<string, unknown>, errors: string[]): void {
    // Basic structural validation for input properties
    for (const key in input) {
      const value = input[key];
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && typeof value !== 'object' || value === null) {
        errors.push(`Input property '${key}' must be a string, number, boolean, or object.`);
      }
    }
  }

  private validateTemporalConstraints(toolCall: ToolCall, errors: string[]): void {
    // Mock logic: Assume tool calls require a minimum duration check based on name/input
    const requiredDurationMinutes = this.calculateRequiredDuration(toolCall);

    if (requiredDurationMinutes > 0) {
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + requiredDurationMinutes);

      if (endTime > this.context.timeWindowEnd) {
        errors.push(`Tool call '${toolCall.name}' requires ${requiredDurationMinutes} minutes, which extends beyond the context time window end (${this.context.timeWindowEnd.toISOString()}).`);
      }
    }
  }

  private validateResourceConstraints(toolCall: ToolCall, errors: string[]): void {
    // Mock logic: Check for resource requirements based on tool name or input
    const requiredResources = this.determineRequiredResources(toolCall);

    for (const [resourceName, requiredAmount] of Object.entries(requiredResources)) {
      const available = this.context.availableResources[resourceName];
      if (!available) {
        errors.push(`Resource '${resourceName}' is required but not tracked in the current context.`);
        continue;
      }

      if (requiredAmount > available.capacity) {
        errors.push(`Insufficient resource '${resourceName}'. Required: ${requiredAmount} ${available.unit}, Available: ${available.capacity} ${available.unit}.`);
      }
    }
  }

  private calculateRequiredDuration(toolCall: ToolCall): number {
    // Placeholder implementation: Simulate duration calculation
    if (toolCall.name.includes("long_running")) {
      return 30; // 30 minutes
    }
    return 0;
  }

  private determineRequiredResources(toolCall: ToolCall): Record<string, number> {
    // Placeholder implementation: Simulate resource requirement detection
    const resources: Record<string, number> = {};
    if (toolCall.name.includes("database")) {
      resources["db_connection"] = 1;
    }
    if (toolCall.input && typeof toolCall.input.get_user_id === 'string' && toolCall.input.get_user_id.length > 10) {
        resources["user_auth"] = 1;
    }
    return resources;
  }
}