import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ContextSource = {
  name: string;
  data: Record<string, unknown>;
  priority: number;
};

export interface EnrichedContext {
  source_data: Record<string, {
    source: string;
    value: unknown;
    weight: number;
  }>;
  resolved_context: Record<string, unknown>;
  conflict_resolution_metadata: {
    resolved_fields: string[];
    conflicts_detected: boolean;
  };
}

export class StructuredToolCallContextEnricher {
  private readonly sources: ContextSource[];

  constructor(initialSources: ContextSource[] = []) {
    this.sources = initialSources;
  }

  public addSource(source: ContextSource): StructuredToolCallContextEnricher {
    this.sources.push(source);
    return this;
  }

  private resolveConflict(key: string, values: { source: string; value: unknown; weight: number }[]): unknown {
    if (values.length === 0) {
      return undefined;
    }

    const weightedSum = values.reduce((acc, v) => acc + (v.weight || 1), 0);

    if (weightedSum === 0) {
      return undefined;
    }

    const bestValue = values.reduce((best, current) => {
      if (current.weight * (current.weight || 1) > best.weight * (best.weight || 1)) {
        return current;
      }
      return best;
    }, values[0]);

    return bestValue.value;
  }

  public enrich(
    userIntent: UserMessage | null,
    resourceConstraints: Record<string, unknown> | null,
    knowledgeGraphLinks: Record<string, unknown> | null,
  ): EnrichedContext {
    const contextSources: ContextSource[] = [];

    if (userIntent) {
      contextSources.push({
        name: "user_intent",
        data: { intent_summary: userIntent.content },
        priority: 3,
      });
    }

    if (resourceConstraints) {
      contextSources.push({
        name: "resource_constraints",
        data: resourceConstraints,
        priority: 2,
      });
    }

    if (knowledgeGraphLinks) {
      contextSources.push({
        name: "knowledge_graph",
        data: knowledgeGraphLinks,
        priority: 1,
      });
    }

    const enrichedContext: EnrichedContext = {
      source_data: {},
      resolved_context: {},
      conflict_resolution_metadata: {
        resolved_fields: [],
        conflicts_detected: false,
      },
    };

    const allKeys: Set<string> = new Set<string>();
    const keyToSources: Map<string, { source: string; value: unknown; weight: number }[]> = new Map();

    for (const source of contextSources) {
      for (const key in source.data) {
        const keyStr = key.toString();
        const value = source.data[keyStr];
        const weight = source.priority;

        allKeys.add(keyStr);

        if (!keyToSources.has(keyStr)) {
          keyToSources.set(keyStr, []);
        }
        keyToSources.get(keyStr)!.push({
          source: source.name,
          value: value,
          weight: weight,
        });
      }
    }

    for (const key of allKeys) {
      const sourcesForKey = keyToSources.get(key)!;
      enrichedContext.source_data[key] = {
        source: sourcesForKey[0].source,
        value: sourcesForKey[0].value,
        weight: sourcesForKey[0].weight,
      };

      const resolvedValue = this.resolveConflict(key, sourcesForKey);
      enrichedContext.resolved_context[key] = resolvedValue;
      enrichedContext.conflict_resolution_metadata.resolved_fields.push(key);
    }

    enrichedContext.conflict_resolution_metadata.conflicts_detected = allKeys.size > 1;

    return enrichedContext;
  }
}