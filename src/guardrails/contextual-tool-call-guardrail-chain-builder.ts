import { Message, ToolUseBlock } from "./types";

export interface ToolCallContext {
  message: Message;
  toolCall: ToolUseBlock;
}

export interface GuardrailResult {
  isValid: boolean;
  message: string;
  context: Record<string, unknown>;
}

export interface Guardrail {
  validate(context: ToolCallContext): GuardrailResult;
}

export class ContextualToolCallGuardrailChainBuilder {
  private validators: Guardrail[] = [];

  addValidator(validator: Guardrail): this {
    this.validators.push(validator);
    return this;
  }

  build(): ToolCallGuardrailChain {
    return new ToolCallGuardrailChain(this.validators);
  }
}

export class ToolCallGuardrailChain {
  private validators: Guardrail[];

  constructor(validators: Guardrail[]) {
    this.validators = validators;
  }

  execute(context: ToolCallContext): GuardrailResult {
    let currentContext: ToolCallContext = {
      message: context.message,
      toolCall: context.toolCall,
    };

    for (const validator of this.validators) {
      const result = validator.validate(currentContext);
      if (!result.isValid) {
        return {
          isValid: false,
          message: `Guardrail failed: ${result.message}`,
          context: { ...currentContext.context, ...result.context },
        };
      }
      // In a real scenario, subsequent validators might need updated context
      // For simplicity, we pass the original context structure but allow validators to augment it.
      currentContext = {
        message: context.message,
        toolCall: context.toolCall,
      };
    }

    return {
      isValid: true,
      message: "All guardrails passed.",
      context: { ...currentContext.context },
    };
  }
}