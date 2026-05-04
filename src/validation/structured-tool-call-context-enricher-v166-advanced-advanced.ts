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

interface HistoryContext {
  messages: Message[];
}

interface ConstraintContext {
  constraints: Record<string, any>;
}

interface KnowledgeContext {
  knowledgeGraphData: Record<string, any>;
}

interface ToolCallContext {
  tool_calls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
}

interface EnrichedContext {
  finalToolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
  resolvedConstraints: Record<string, any>;
  augmentedKnowledge: Record<string, any>;
  sourceConfidenceScore: number;
}

export class StructuredToolCallContextEnricher {
  private history: HistoryContext;
  private constraints: ConstraintContext;
  private knowledge: KnowledgeContext;

  constructor(
    history: HistoryContext,
    constraints: ConstraintContext,
    knowledge: KnowledgeContext
  ) {
    this.history = history;
    this.constraints = constraints;
    this.knowledge = knowledge;
  }

  private resolveToolCallConflict(
    existingCalls: { id: string; name: string; input: Record<string, unknown> }[],
    newCalls: { id: string; name: string; input: Record<string, unknown> }[]
  ): { id: string; name: string; input: Record<string, unknown> }[] {
    const combinedMap = new Map<string, { id: string; name: string; input: Record<string, unknown> }>();

    const processCalls = (calls: { id: string; name: string; input: Record<string, unknown> }[]) => {
      calls.forEach(call => {
        // Simple conflict resolution: prefer the call with the most specific input structure
        if (!combinedMap.has(call.id) || Object.keys(call.input).length > Object.keys(combinedMap.get(call.id)!.input).length) {
          combinedMap.set(call.id, call);
        }
      });
    };

    processCalls(existingCalls);
    processCalls(newCalls);

    return Array.from(combinedMap.values());
  }

  private mergeConstraints(
    historyConstraints: Record<string, any>,
    currentConstraints: Record<string, any>,
    knowledgeConstraints: Record<string, any>
  ): Record<string, any> {
    const merged: Record<string, any> = { ...currentConstraints };

    // Rule 1: History constraints override general constraints if they are more specific (non-null/undefined)
    Object.keys(historyConstraints).forEach(key => {
      if (historyConstraints[key] !== undefined && historyConstraints[key] !== null) {
        merged[key] = historyConstraints[key];
      }
    });

    // Rule 2: Knowledge graph provides defaults, but explicit constraints take precedence
    Object.keys(knowledgeConstraints).forEach(key => {
      if (!(key in merged)) {
        merged[key] = knowledgeConstraints[key];
      }
    });

    return merged;
  }

  public enrichContext(
    rawContext: ToolCallContext
  ): EnrichedContext {
    // 1. Resolve Tool Calls (Conflict Resolution)
    // Assume rawContext.tool_calls are the 'new' calls, and we might derive 'existing' from history/knowledge
    const existingCallsFromHistory: { id: string; name: string; input: Record<string, unknown> }[] = [];
    // Placeholder: In a real system, we'd parse history for previous tool calls.
    // For this implementation, we treat the raw context as the primary source for new calls.
    const resolvedToolCalls = this.resolveToolCallConflict(
      existingCallsFromHistory,
      rawContext.tool_calls
    );

    // 2. Merge Constraints
    const resolvedConstraints = this.mergeConstraints(
      this.history.messages.length > 0 ? {} : {}, // Simplified history constraint extraction
      this.constraints.constraints,
      this.knowledge.knowledgeGraphData
    );

    // 3. Augment Knowledge
    const augmentedKnowledge = {
      ...this.knowledge.knowledgeGraphData,
      // Example augmentation: Merge any specific context data found in the last user message
      ...(this.history.messages.length > 0 && this.history.messages[this.history.messages.length - 1] is UserMessage
        ? { last_user_intent: this.history.messages[this.history.messages.length - 1].content }
        : {}),
    };

    // 4. Calculate Confidence Score (Simple heuristic: more sources used = higher score)
    const sourceConfidenceScore = 1.0 + (
      (this.history.messages.length > 0 ? 0.3 : 0) +
      (Object.keys(this.constraints.constraints).length > 0 ? 0.3 : 0) +
      (Object.keys(this.knowledge.knowledgeGraphData).length > 0 ? 0.4 : 0)
    );

    return {
      finalToolCalls: resolvedToolCalls,
      resolvedConstraints: resolvedConstraints,
      augmentedKnowledge: augmentedKnowledge,
      sourceConfidenceScore: Math.min(1.0, sourceConfidenceScore),
    };
  }
}