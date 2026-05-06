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

type Context = {
  history: Message[];
  contextData: Record<string, unknown>;
  resourceConstraints: Record<string, any>;
};

type GuardrailValidator = (
  context: Context;
  toolCall: ToolUseBlock;
  history: Message[]
) => {
  isValid: boolean;
  reason: string;
  correctedToolCall?: ToolUseBlock;
};

interface GuardrailBuilder {
  buildValidator(): GuardrailValidator;
}

class GuardrailChainBuilder {
  private validators: GuardrailValidator[] = [];
  private enrichmentSteps: ((context: Context) => Promise<Context>)[] = [];

  addValidator(builder: GuardrailBuilder): this {
    this.validators.push(builder.buildValidator());
    return this;
  }

  addEnrichmentStep(step: (context: Context) => Promise<Context>): this {
    this.enrichmentSteps.push(step);
    return this;
  }

  private async executeEnrichment(initialContext: Context): Promise<Context> {
    let currentContext: Context = { ...initialContext };
    for (const step of this.enrichmentSteps) {
      currentContext = await step(currentContext);
    }
    return currentContext;
  }

  public build(): (
    context: Context;
    toolCall: ToolUseBlock;
    history: Message[]
  ) => Promise<{ isValid: boolean; reason: string; correctedToolCall?: ToolUseBlock }> {
    return async (context: Context, toolCall: ToolUseBlock, history: Message[]): Promise<{ isValid: boolean; reason: string; correctedToolCall?: ToolUseBlock }> => {
      let enrichedContext: Context;
      try {
        enrichedContext = await this.executeEnrichment(context);
      } catch (e) {
        return { isValid: false, reason: `Enrichment failed: ${(e as Error).message}` };
      }

      for (const validator of this.validators) {
        const result = validator(enrichedContext, toolCall, history);
        if (!result.isValid) {
          return { isValid: false, reason: result.reason, correctedToolCall: result.correctedToolCall };
        }
      }

      return { isValid: true, reason: "All guardrails passed.", correctedToolCall: undefined };
    };
  }

  public buildAdvanced(): (
    context: Context;
    toolCall: ToolUseBlock;
    history: Message[]
  ) => Promise<{ isValid: boolean; reason: string; correctedToolCall?: ToolUseBlock }> {
    return async (context: Context, toolCall: ToolUseBlock, history: Message[]): Promise<{ isValid: boolean; reason: string; correctedToolCall?: ToolUseBlock }> => {
      let enrichedContext: Context;
      try {
        enrichedContext = await this.executeEnrichment(context);
      } catch (e) {
        return { isValid: false, reason: `Advanced enrichment failed: ${(e as Error).message}` };
      }

      for (const validator of this.validators) {
        const result = validator(enrichedContext, toolCall, history);
        if (!result.isValid) {
          return { isValid: false, reason: result.reason, correctedToolCall: result.correctedToolCall };
        }
      }

      return { isValid: true, reason: "All advanced guardrails passed.", correctedToolCall: undefined };
    };
  }
}

export { GuardrailChainBuilder };