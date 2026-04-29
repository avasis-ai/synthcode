import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface IContextEnricher {
  enrichContext(
    messages: Message[],
    executionContext: Record<string, unknown>,
    sessionState: Record<string, unknown>
  ): Promise<Record<string, unknown>>;
}

export class StructuredToolOutputValidationContextEnricherV143 {
  private enrichers: IContextEnricher[];

  constructor(enrichers: IContextEnricher[] = []) {
    this.enrichers = enrichers;
  }

  async enrichContext(
    messages: Message[],
    executionContext: Record<string, unknown>,
    sessionState: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const initialContext: Record<string, unknown> = {
      messages,
      executionContext,
      sessionState,
      metadata: {},
    };

    let aggregatedContext: Record<string, unknown> = {
      messages: messages,
      executionContext: executionContext,
      sessionState: sessionState,
      metadata: {},
    };

    for (const enricher of this.enrichers) {
      const enrichedData = await enricher.enrichContext(
        messages,
        executionContext,
        sessionState
      );
      
      aggregatedContext.metadata = {
        ...(aggregatedContext.metadata as Record<string, unknown>),
        ...(enrichedData as Record<string, unknown>),
      };
    }

    return aggregatedContext;
  }
}