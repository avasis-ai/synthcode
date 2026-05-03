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

type ToolCallDependencyMap = Map<string, {
  requiredInputs: Record<string, {
    sourceMessageId: string;
    sourceOutputKey: string;
    expectedType: any;
  }>;
  dependencies: {
    callId: string;
    requiredInputs: Record<string, {
      sourceMessageId: string;
      sourceOutputKey: string;
      expectedType: any;
    }
  }[];
};

interface ValidationContext {
  messageHistory: Message[];
  toolCallDependencies: ToolCallDependencyMap;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ContextualToolCallValidator {
  private context: ValidationContext;

  private constructor(context: ValidationContext) {
    this.context = context;
  }

  public static build(context: ValidationContext): ContextualToolCallValidator {
    return new ContextualToolCallValidator(context);
  }

  private validateSchema(
    messageHistory: Message[]
  ): ValidationResult {
    const errors: string[] = [];
    if (messageHistory.length === 0) {
      errors.push("Message history cannot be empty.");
    }
    // Simplified schema validation for demonstration
    for (let i = 0; i < messageHistory.length; i++) {
      const msg = messageHistory[i];
      if (msg.role === "assistant" && !(msg as AssistantMessage).content.some(
        (block) => block.type === "tool_use"
      )) {
        // Placeholder check
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  private validateDependencies(
    messageHistory: Message[]
  ): ValidationResult {
    const errors: string[] = [];
    const dependencies = this.context.toolCallDependencies;

    for (const [callId, { dependencies: callDependencies }] of dependencies.entries()) {
      for (const dep of callDependencies) {
        const sourceMessage = messageHistory.find(
          (msg) => {
            if (msg.role === "tool" && (msg as ToolResultMessage).tool_use_id === dep.sourceMessageId) {
              return true;
            }
            return false;
          }
        );

        if (!sourceMessage) {
          errors.push(
            `Dependency check failed for call ${callId}: Source message with ID ${dep.sourceMessageId} not found.`
          );
          continue;
        }

        // In a real scenario, we'd extract the specific output key from the sourceMessage
        // For simplicity, we assume the source output is available if the message exists.
        const sourceOutput = "mock_output_for_" + dep.sourceMessageId;

        // Type checking logic placeholder
        if (typeof dep.requiredInputs[Object.keys(dep.requiredInputs)[0]]?.expectedType !== 'any') {
          errors.push(
            `Dependency check failed for call ${callId}: Expected type for input ${Object.keys(dep.requiredInputs)[0]} is invalid.`
          );
        }
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  private validateConstraints(
    messageHistory: Message[]
  ): ValidationResult {
    const errors: string[] = [];
    // Constraint validation logic placeholder
    if (messageHistory.length > 5) {
      errors.push("Too many messages, potential constraint violation.");
    }
    return { isValid: errors.length === 0, errors };
  }

  public validate(): ValidationResult {
    const schemaResult = this.validateSchema(this.context.messageHistory);
    if (!schemaResult.isValid) {
      return { isValid: false, errors: [...schemaResult.errors, ...this.validateDependencies(this.context.messageHistory).errors] };
    }

    const dependencyResult = this.validateDependencies(this.context.messageHistory);
    if (!dependencyResult.isValid) {
      return { isValid: false, errors: [...dependencyResult.errors, ...this.validateConstraints(this.context.messageHistory).errors] };
    }

    const constraintResult = this.validateConstraints(this.context.messageHistory);
    return {
      isValid: constraintResult.isValid,
      errors: [...dependencyResult.errors, ...constraintResult.errors],
    };
  }

  public validateAndBuildChain(
    initialSchemaCheck: boolean,
    runDependencyCheck: boolean,
    runConstraintCheck: boolean
  ): ValidationResult {
    const results: ValidationResult[] = [];

    if (initialSchemaCheck) {
      const schemaResult = this.validateSchema(this.context.messageHistory);
      results.push(schemaResult);
    }

    if (runDependencyCheck) {
      const dependencyResult = this.validateDependencies(this.context.messageHistory);
      results.push(dependencyResult);
    }

    if (runConstraintCheck) {
      const constraintResult = this.validateConstraints(this.context.messageHistory);
      results.push(constraintResult);
    }

    const allErrors: string[] = [];
    let overallValid = true;

    for (const result of results) {
      if (!result.isValid) {
        overallValid = false;
        allErrors.push(...result.errors);
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
    };
  }
}