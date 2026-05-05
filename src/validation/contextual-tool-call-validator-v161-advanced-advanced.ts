import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ContextEnrichmentSource {
  enrichContext(
    messageHistory: Message[],
    currentState: Record<string, unknown>,
    globalConstraints: Record<string, unknown>
  ): Promise<Record<string, unknown>>;
}

export interface ValidationStep {
  validate(
    toolCall: { name: string; input: Record<string, unknown> },
    context: Record<string, unknown>
  ): Promise<boolean>;
}

export class ContextualToolCallValidator {
  private sources: ContextEnrichmentSource[] = [];
  private steps: ValidationStep[] = [];

  private constructor() {}

  public static getInstance(): ContextualToolCallValidator {
    if (!ContextualToolCallValidator.instance) {
      ContextualToolCallValidator.instance = new ContextualToolCallValidator();
    }
    return ContextualToolCallValidator.instance;
  }

  public addContextSource(source: ContextEnrichmentSource): this {
    this.sources.push(source);
    return this;
  }

  public addValidationStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  private async enrichContext(
    messageHistory: Message[],
    currentState: Record<string, unknown>,
    globalConstraints: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    let enrichedContext: Record<string, unknown> = {
      history: messageHistory,
      state: currentState,
      constraints: globalConstraints,
    };

    for (const source of this.sources) {
      const contextUpdate = await source.enrichContext(
        messageHistory,
        currentState,
        globalConstraints
      );
      enrichedContext = { ...enrichedContext, ...contextUpdate };
    }
    return enrichedContext;
  }

  public async validateToolCall(
    toolCall: { name: string; input: Record<string, unknown> },
    messageHistory: Message[],
    currentState: Record<string, unknown>,
    globalConstraints: Record<string, unknown>
  ): Promise<{ isValid: boolean; context: Record<string, unknown>; errors: string[] }> {
    const context = await this.enrichContext(
      messageHistory,
      currentState,
      globalConstraints
    );

    const errors: string[] = [];
    let isValid = true;

    for (const step of this.steps) {
      try {
        const stepValid = await step.validate(toolCall, context);
        if (!stepValid) {
          isValid = false;
          errors.push(`Validation failed at step: ${step.constructor.name}`);
        }
      } catch (e) {
        isValid = false;
        errors.push(`Error during validation step ${step.constructor.name}: ${(e as Error).message}`);
      }
    }

    return { isValid, context, errors };
  }

  public static get instance(): ContextualToolCallValidator {
    if (!ContextualToolCallValidator.instance) {
      ContextualToolCallValidator.instance = new ContextualToolCallValidator();
    }
    return ContextualToolCallValidator.instance;
  }
}

export const buildValidator = (): ContextualToolCallValidator => {
  return ContextualToolCallValidator.instance;
};