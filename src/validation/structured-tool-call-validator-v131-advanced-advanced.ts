import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export type ValidationContext = {
  messages: Message[];
  currentState: Record<string, unknown>;
  toolDefinitions: Record<string, any>;
};

export interface AdvancedValidatorContext extends ValidationContext {
  // Additional context for advanced validation, e.g., session history, user profile
  sessionMetadata: Record<string, unknown>;
}

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  enrichedContext: Record<string, unknown>;
};

type ValidatorStep = (context: AdvancedValidatorContext) => {
  result: ValidationResult;
  nextContext: AdvancedValidatorContext;
};

export class StructuredToolCallValidatorAdvanced {
  private context: AdvancedValidatorContext;

  constructor(context: AdvancedValidatorContext) {
    this.context = context;
  }

  private validateSchema(toolCall: ToolUseBlock): ValidationResult {
    const errors: string[] = [];
    if (!toolCall.name || typeof toolCall.name !== 'string') {
      errors.push("Tool call must specify a name.");
    }
    // Basic input validation placeholder
    if (typeof toolCall.input !== 'object' || toolCall.input === null) {
      errors.push("Tool call input must be a valid object.");
    }
    return { isValid: errors.length === 0, errors, enrichedContext: { ...this.context.currentState } };
  }

  private validateDependencies(toolCall: ToolUseBlock): ValidationResult {
    const errors: string[] = [];
    // Example: Check if required inputs are present based on tool definitions
    const definition = this.context.toolDefinitions[toolCall.name];
    if (definition && definition.requiredInputs) {
      for (const key of Object.keys(definition.requiredInputs)) {
        if (!(key in toolCall.input)) {
          errors.push(`Missing required input '${key}' for tool '${toolCall.name}'.`);
        }
      }
    }
    return { isValid: errors.length === 0, errors, enrichedContext: { ...this.context.currentState } };
  }

  private enrichContext(toolCall: ToolUseBlock): AdvancedValidatorContext {
    const newContext: AdvancedValidatorContext = {
      ...this.context,
      currentState: {
        ...this.context.currentState,
        lastValidatedToolCall: toolCall,
        toolCallValidatedAt: Date.now(),
      },
      sessionMetadata: {
        ...this.context.sessionMetadata,
        lastToolCall: toolCall.name,
      }
    };
    return newContext;
  }

  private validateStateConsistency(toolCall: ToolUseBlock): ValidationResult {
    const errors: string[] = [];
    // Example: Check if the tool call contradicts the current state (e.g., calling 'create_user' when user already exists)
    if (this.context.currentState.userStatus === 'active' && toolCall.name === 'create_user') {
      errors.push("Cannot create user; user status is already active.");
    }
    return { isValid: errors.length === 0, errors, enrichedContext: { ...this.context.currentState } };
  }

  public validateToolCall(toolCall: ToolUseBlock): ValidationResult {
    let currentContext: AdvancedValidatorContext = {
      messages: this.context.messages,
      currentState: { ...this.context.currentState },
      toolDefinitions: this.context.toolDefinitions,
      sessionMetadata: { ...this.context.sessionMetadata }
    };

    const steps: ValidatorStep[] = [
      (context) => {
        const result = this.validateSchema(toolCall);
        return { result, nextContext: { ...context, currentState: result.enrichedContext } };
      },
      (context) => {
        const result = this.validateDependencies(toolCall);
        return { result, nextContext: { ...context, currentState: result.enrichedContext } };
      },
      (context) => {
        const result = this.validateStateConsistency(toolCall);
        return { result, nextContext: { ...context, currentState: result.enrichedContext } };
      },
      (context) => {
        const nextContext = this.enrichContext(toolCall);
        return { result: { isValid: true, errors: [], enrichedContext: nextContext.currentState }, nextContext };
      }
    ];

    let currentResult: ValidationResult = { isValid: true, errors: [], enrichedContext: {} };
    let finalContext: AdvancedValidatorContext = currentContext;

    for (const step of steps) {
      const stepOutput = step(finalContext);
      currentResult.errors.push(...stepOutput.result.errors);
      currentResult.isValid = currentResult.isValid && stepOutput.result.isValid;
      finalContext = stepOutput.nextContext;
    }

    return {
      isValid: currentResult.isValid,
      errors: currentResult.errors,
      enrichedContext: finalContext.currentState
    };
  }
}