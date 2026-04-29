import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface AgentContext {
  current_state: Record<string, unknown>;
  history: Message[];
  user_intent: string;
}

export interface SchemaContext {
  tool_schemas: Record<string, any>;
  global_constraints: string[];
}

export interface ToolCallContext {
  initial_tool_call: {
    name: string;
    input: Record<string, unknown>;
  };
}

export interface ValidationContext {
  agent_context: AgentContext;
  schema_context: SchemaContext;
  tool_call_context: ToolCallContext;
  final_history: Message[];
}

export class StructuredToolCallContextBuilder {
  private agentContext: AgentContext;
  private schemaContext: SchemaContext;
  private toolCallContext: ToolCallContext;
  private history: Message[];

  constructor(
    agentContext: AgentContext,
    schemaContext: SchemaContext,
    toolCallContext: ToolCallContext,
    initialHistory: Message[]
  ) {
    this.agentContext = agentContext;
    this.schemaContext = schemaContext;
    this.toolCallContext = toolCallContext;
    this.history = initialHistory;
  }

  withHistory(history: Message[]): this {
    this.history = history;
    return this;
  }

  withStateSnapshot(state: Record<string, unknown>): this {
    this.agentContext = {
      ...this.agentContext,
      current_state: state,
    };
    return this;
  }

  withUserIntent(intent: string): this {
    this.agentContext = {
      ...this.agentContext,
      user_intent: intent,
    };
    return this;
  }

  withSchemaContext(schemas: Record<string, any>, constraints: string[]): this {
    this.schemaContext = {
      tool_schemas: schemas,
      global_constraints: constraints,
    };
    return this;
  }

  build(): ValidationContext {
    return {
      agent_context: this.agentContext,
      schema_context: this.schemaContext,
      tool_call_context: this.toolCallContext,
      final_history: this.history,
    };
  }
}