import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface HistoricalContext {
  last_n_interactions: Message[];
  user_preferences: Record<string, any>;
}

interface KnowledgeGraphContext {
  related_entities: Record<string, string[]>;
  suggested_tools: string[];
}

export interface EnrichedValidationContext {
  base_context: {
    messages: Message[];
    session_id: string;
  };
  historical_context: HistoricalContext;
  knowledge_graph_context: KnowledgeGraphContext;
  unified_context: Record<string, any>;
}

interface ContextEnricherDependencies {
  getHistoricalContext: (sessionId: string) => Promise<HistoricalContext>;
  getKnowledgeGraphContext: (input: string, sessionId: string) => Promise<KnowledgeGraphContext>;
}

export class StructuredToolCallValidatorContextEnricherV160Advanced {
  private dependencies: ContextEnricherDependencies;

  constructor(dependencies: ContextEnricherDependencies) {
    this.dependencies = dependencies;
  }

  private async enrichContext(
    sessionId: string,
    baseMessages: Message[]
  ): Promise<EnrichedValidationContext> {
    const [historicalContext, knowledgeGraphContext] = await Promise.all([
      this.dependencies.getHistoricalContext(sessionId),
      this.dependencies.getKnowledgeGraphContext(baseMessages.map(m => m.content).join(" "), sessionId),
    ]);

    const unifiedContext: Record<string, any> = {
      ...historicalContext.user_preferences,
      ...knowledgeGraphContext.related_entities,
      suggested_tools: knowledgeGraphContext.suggested_tools,
    };

    return {
      base_context: {
        messages: baseMessages,
        session_id: sessionId,
      },
      historical_context: historicalContext,
      knowledge_graph_context: knowledgeGraphContext,
      unified_context: unifiedContext,
    };
  }

  public async enrich(
    sessionId: string,
    baseMessages: Message[]
  ): Promise<EnrichedValidationContext> {
    return this.enrichContext(sessionId, baseMessages);
  }

  public static async validateAndEnrich(
    sessionId: string,
    baseMessages: Message[],
    dependencies: ContextEnricherDependencies
  ): Promise<EnrichedValidationContext> {
    const enricher = new StructuredToolCallValidatorContextEnricherV160Advanced(dependencies);
    return enricher.enrich(sessionId, baseMessages);
  }
}