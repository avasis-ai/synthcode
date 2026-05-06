import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface AgentState {
  history: Message[];
  current_state: Record<string, any>;
  available_tools: Record<string, any>;
}

export interface ToolCallContext {
  tool_name: string;
  parameters: Record<string, unknown>;
  history: Message[];
  state: AgentState;
}

export interface ContextEnricher {
  enrich(context: ToolCallContext): Partial<Record<string, unknown>>;
}

class StructuredToolCallContextEnricherV162AdvancedAdvanced implements ContextEnricher {
  private readonly stateBasedEnricher: ContextEnricher;
  private readonly historyBasedEnricher: ContextEnricher;
  private readonly constraintBasedEnricher: ContextEnricher;

  constructor() {
    this.stateBasedEnricher = new StateBasedEnricher();
    this.historyBasedEnricher = new HistoryBasedEnricher();
    this.constraintBasedEnricher = new ConstraintBasedEnricher();
  }

  enrich(context: ToolCallContext): Partial<Record<string, unknown>> {
    const stateEnrichments = this.stateBasedEnricher.enrich(context);
    const historyEnrichments = this.historyBasedEnricher.enrich(context);
    const constraintEnrichments = this.constraintBasedEnricher.enrich(context);

    return {
      ...stateEnrichments,
      ...historyEnrichments,
      ...constraintEnrichments,
    };
  }
}

class StateBasedEnricher implements ContextEnricher {
  enrich(context: ToolCallContext): Partial<Record<string, unknown>> {
    const state = context.state;
    const toolName = context.tool_name;
    const toolDefinition = state.available_tools[toolName];

    if (!toolDefinition || !toolDefinition.parameters) {
      return {};
    }

    const requiredParams = Object.keys(toolDefinition.parameters.properties || {});
    const enrichedParams: Partial<Record<string, unknown>> = {};

    for (const param of requiredParams) {
      if (typeof (state.current_state[param] as any) !== 'undefined' && state.current_state[param] !== null) {
        enrichedParams[param] = state.current_state[param];
      }
    }

    return enrichedParams;
  }
}

class HistoryBasedEnricher implements ContextEnricher {
  enrich(context: ToolCallContext): Partial<Record<string, unknown>> {
    const history = context.history;
    const lastUserMessage = history.filter(m => m.role === "user").pop() as UserMessage | undefined;

    if (!lastUserMessage) {
      return {};
    }

    // Simple example: If the last user message contains a number, assume 'count' parameter.
    const numberMatch = lastUserMessage.content.match(/\d+/);
    if (numberMatch) {
      const count = parseInt(numberMatch[0], 10);
      return { count: count };
    }

    return {};
  }
}

class ConstraintBasedEnricher implements ContextEnricher {
  enrich(context: ToolCallContext): Partial<Record<string, unknown>> {
    const toolDefinition = context.state.available_tools[context.tool_name];
    if (!toolDefinition || !toolDefinition.parameters) {
      return {};
    }

    const parameters = toolDefinition.parameters.properties || {};
    const enrichedParams: Partial<Record<string, unknown>> = {};

    // Example constraint: If 'date' is expected, and history suggests a recent date, inject it.
    if (parameters.date && typeof parameters.date.description === 'string' && context.history.length > 0) {
      const lastToolResult = context.history.filter(m => m.role === "tool").pop() as ToolResultMessage | undefined;
      if (lastToolResult && lastToolResult.content.includes("2024-01-15")) {
        enrichedParams.date = "2024-01-15";
      }
    }

    return enrichedParams;
  }
}

export { StructuredToolCallContextEnricherV162AdvancedAdvanced };