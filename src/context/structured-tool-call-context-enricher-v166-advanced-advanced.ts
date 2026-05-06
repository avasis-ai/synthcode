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

type ContextSource = {
  name: string;
  context: any;
  weight: number;
};

interface EnrichedContext {
  final_state: Record<string, unknown>;
  resolved_tool_inputs: Record<string, any>;
  priority_summary: string;
}

class StructuredToolCallContextEnricher {
  private sources: ContextSource[];

  constructor(initialSources: ContextSource[] = []) {
    this.sources = initialSources;
  }

  addSource(source: ContextSource): StructuredToolCallContextEnricher {
    this.sources.push(source);
    return this;
  }

  private resolveConflict(key: string, values: any[]): any {
    if (values.length === 0) return undefined;
    if (values.length === 1) return values[0];

    // Simple conflict resolution: prioritize the last non-null/undefined value
    // or use a weighted average if applicable (simplified here for demonstration)
    let resolvedValue: any = values[0];
    for (let i = 1; i < values.length; i++) {
      const currentValue = values[i];
      if (currentValue !== null && currentValue !== undefined) {
        resolvedValue = currentValue;
      }
    }
    return resolvedValue;
  }

  private fuseState(stateSources: ContextSource[]): Record<string, unknown> {
    const stateMap: Record<string, any[]> = {};
    for (const source of stateSources) {
      if (source.context && typeof source.context === 'object') {
        Object.keys(source.context).forEach(key => {
          if (!stateMap[key]) {
            stateMap[key] = [];
          }
          stateMap[key].push(source.context[key]);
        });
      }
    }

    const finalState: Record<string, unknown> = {};
    for (const key in stateMap) {
      finalState[key] = this.resolveConflict(key, stateMap[key]);
    }
    return finalState;
  }

  private fuseToolInputs(toolInputSources: ContextSource[]): Record<string, any> {
    const inputMap: Record<string, any[]> = {};
    for (const source of toolInputSources) {
      if (source.context && typeof source.context === 'object') {
        Object.keys(source.context).forEach(key => {
          if (!inputMap[key]) {
            inputMap[key] = [];
          }
          inputMap[key].push(source.context[key]);
        });
      }
    }

    const finalInputs: Record<string, any> = {};
    for (const key in inputMap) {
      finalInputs[key] = this.resolveConflict(key, inputMap[key]);
    }
    return finalInputs;
  }

  private generateSummary(sources: ContextSource[]): string {
    const sourceNames = sources.map(s => s.name).join(', ');
    const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
    return `Context enriched using sources: ${sourceNames}. Total effective weight: ${totalWeight.toFixed(2)}.`;
  }

  enrich(
    rawToolCall: {
      tool_name: string;
      tool_input: Record<string, unknown>;
    },
    stateContext: ContextSource,
    historyContext: ContextSource,
    resourceContext: ContextSource
  ): EnrichedContext {
    const stateSources: ContextSource[] = [stateContext];
    const historySources: ContextSource[] = [historyContext];
    const resourceSources: ContextSource[] = [resourceContext];

    const finalState = this.fuseState([...stateSources, ...historySources, ...resourceSources]);
    const resolvedInputs = this.fuseToolInputs([...stateSources, ...historySources, ...resourceSources]);
    const summary = this.generateSummary([...stateSources, ...historySources, ...resourceSources]);

    return {
      final_state: finalState,
      resolved_tool_inputs: resolvedInputs,
      priority_summary: summary,
    };
  }
}

export { StructuredToolCallContextEnricher };