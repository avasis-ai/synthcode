import { SemanticContextRetriever } from "./semantic-context-retriever";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string };

export interface Context {
  history: Message[];
  current_query: string;
  active_tools: string[];
  last_event: LoopEvent | null;
}

export interface Query {
  query_text: string;
  context: Context;
}

export type FilterResult = {
  should_include: boolean;
  score_adjustment: number;
};

export interface ContextualFilter {
  apply(query: Query): FilterResult;
}

export class ContextAwareRetriever {
  private retriever: SemanticContextRetriever;
  private filters: ContextualFilter[];

  constructor(retriever: SemanticContextRetriever, filters: ContextualFilter[] = []) {
    this.retriever = retriever;
    this.filters = filters;
  }

  public async retrieve(query: Query): Promise<any[]> {
    let initialResults = await this.retriever.retrieve(query.query_text);

    let filteredResults: any[] = [];
    let totalScoreAdjustment = 0;

    for (const filter of this.filters) {
      const filterResult = filter.apply(query);
      if (!filterResult.should_include) {
        return [];
      }
      totalScoreAdjustment += filterResult.score_adjustment;
    }

    const finalResults = initialResults.map((doc: any) => {
      let finalScore = doc.score;
      let adjustedDoc = { ...doc };

      if (totalScoreAdjustment !== 0) {
        adjustedDoc.score = finalScore * Math.exp(totalScoreAdjustment / 100);
      }

      return adjustedDoc;
    });

    return finalResults.sort((a, b) => b.score - a.score);
  }
}