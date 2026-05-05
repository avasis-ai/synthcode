import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ContextState = Record<string, any>;
type GlobalConstraints = Record<string, any>;
type History = Message[];

interface ValidationContext {
  currentState: ContextState;
  history: History;
  globalConstraints: GlobalConstraints;
  explicitContext: Record<string, unknown>;
}

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

interface ValidationResult {
  isValid: boolean;
  enrichedContext: Record<string, unknown>;
  errors: string[];
}

class StructuredToolCallValidatorContextEnricher {
  private readonly requiredTools: string[];

  constructor(requiredTools: string[] = []) {
    this.requiredTools = requiredTools;
  }

  private aggregateContext(
    currentState: ContextState,
    history: History,
    globalConstraints: GlobalConstraints,
    explicitContext: Record<string, unknown>
  ): ValidationContext {
    return {
      currentState,
      history,
      globalConstraints,
      explicitContext,
    };
  }

  private validateTemporalConsistency(context: ValidationContext, toolCall: ToolCall): string[] {
    const errors: string[] = [];
    const lastMessage = context.history.length > 0 ? context.history[context.history.length - 1] : null;

    if (lastMessage) {
      if (lastMessage.role === "tool" && !context.currentState["last_tool_result_processed"]) {
        errors.push("Cannot validate tool call: Previous tool result was not processed or recorded in state.");
      }
    }

    if (context.globalConstraints.hasRecentToolCall && context.globalConstraints.hasRecentToolCall.name !== toolCall.name) {
      errors.push(`Temporal conflict: Global constraints suggest a recent tool call to ${context.globalConstraints.hasRecentToolCall.name}, but the proposed call is for ${toolCall.name}.`);
    }

    return errors;
  }

  private validateResourceAvailability(context: ValidationContext, toolCall: ToolCall): string[] {
    const errors: string[] = [];
    const requiredResources = context.globalConstraints.requiredResources || {};

    for (const resource in requiredResources) {
      if (typeof requiredResources[resource] === 'boolean' && !requiredResources[resource]) {
        errors.push(`Resource constraint failed: ${resource} is marked as unavailable.`);
      }
    }

    if (context.currentState.userPermissions && !context.currentState.userPermissions.includes(toolCall.name)) {
      errors.push(`Permission denied: User lacks permission to use tool ${toolCall.name}.`);
    }

    return errors;
  }

  private validateConstraintSatisfaction(context: ValidationContext, toolCall: ToolCall): string[] {
    const errors: string[] = [];
    if (this.requiredTools.length > 0 && !this.requiredTools.includes(toolCall.name)) {
      errors.push(`Tool usage violation: Tool ${toolCall.name} is not in the allowed list of required tools.`);
    }

    // Simple input schema validation placeholder
    const schema = context.globalConstraints.toolSchemas?.[toolCall.name];
    if (schema) {
      for (const key in schema) {
        const expectedType = schema[key].type;
        const actualValue = toolCall.input[key];
        if (actualValue === undefined) {
          errors.push(`Missing required input: Tool ${toolCall.name} requires '${key}'.`);
        } else if (typeof actualValue !== expectedType && expectedType !== 'any') {
          errors.push(`Type mismatch: Tool ${toolCall.name} expects '${key}' to be ${expectedType}, but received ${typeof actualValue}.`);
        }
      }
    }

    return errors;
  }

  private enrichContext(context: ValidationContext, toolCall: ToolCall): Record<string, unknown> {
    const enriched: Record<string, unknown> = {
      ...context.currentState,
      ...context.explicitContext,
      toolCall: toolCall,
      timestamp: Date.now(),
      validatedAt: true,
    };

    // Merge tool call input into context for downstream use
    enriched[`tool_input_${toolCall.name}`] = toolCall.input;

    return enriched;
  }

  public validateAndEnrich(
    currentState: ContextState,
    history: History,
    globalConstraints: GlobalConstraints,
    explicitContext: Record<string, unknown>,
    toolCall: ToolCall
  ): ValidationResult {
    const context = this.aggregateContext(
      currentState,
      history,
      globalConstraints,
      explicitContext
    );

    const validationErrors: string[] = [];

    // 1. Validate Temporal Consistency
    validationErrors.push(...this.validateTemporalConsistency(context, toolCall));

    // 2. Validate Resource Availability
    validationErrors.push(...this.validateResourceAvailability(context, toolCall));

    // 3. Validate Constraint Satisfaction
    validationErrors.push(...this.validateConstraintSatisfaction(context, toolCall));

    const isValid = validationErrors.length === 0;
    const enrichedContext = this.enrichContext(context, toolCall);

    return {
      isValid,
      enrichedContext,
      errors: validationErrors,
    };
  }
}

export { StructuredToolCallValidatorContextEnricher };