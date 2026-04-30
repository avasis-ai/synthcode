import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ContextSource {
  sourceName: string;
  enrich(context: { history: Message[]; systemPrompt: string; knowledge: Record<string, any> }): Promise<Message[]>;
}

export interface EnrichmentPipeline {
  enrich(context: { history: Message[]; systemPrompt: string; knowledge: Record<string, any> }): Promise<{ enrichedContext: Message[]; finalContext: Record<string, any> }>;
}

export class StructuredToolCallValidatorContextEnricherV151AdvancedAdvanced {
  private sources: ContextSource[];
  private pipeline: EnrichmentPipeline;

  constructor(sources: ContextSource[], pipeline: EnrichmentPipeline) {
    this.sources = sources;
    this.pipeline = pipeline;
  }

  public async enrichContext(initialContext: { history: Message[]; systemPrompt: string; knowledge: Record<string, any> }): Promise<{ enrichedContext: Message[]; finalContext: Record<string, any> }> {
    let currentContext: { history: Message[]; systemPrompt: string; knowledge: Record<string, any> } = {
      history: initialContext.history,
      systemPrompt: initialContext.systemPrompt,
      knowledge: initialContext.knowledge,
    };

    let mergedMessages: Message[] = [...initialContext.history];

    for (const source of this.sources) {
      const enrichedMessages = await source.enrich(currentContext);
      mergedMessages = [...mergedMessages, ...enrichedMessages];
      currentContext.history = enrichedMessages;
    }

    const { enrichedContext, finalContext } = await this.pipeline.enrich(currentContext);

    return {
      enrichedContext: [...mergedMessages, ...enrichedContext],
      finalContext: finalContext,
    };
  }
}