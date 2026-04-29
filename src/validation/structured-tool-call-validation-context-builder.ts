import { Message, ContentBlock, ToolUseBlock } from "./types";

export type SchemaRegistry = Record<string, any>;
export type StateManager = Record<string, any>;

export interface ValidationContext {
  initialMessage: Message;
  toolCall: ToolUseBlock;
  schemaContext: SchemaRegistry;
  stateContext: StateManager;
  history: Message[];
}

export class StructuredToolCallValidationContextBuilder {
  private context: {
    initialMessage: Message;
    toolCall: ToolUseBlock;
    schemaContext: SchemaRegistry;
    stateContext: StateManager;
    history: Message[];
  };

  constructor(initialMessage: Message, toolCall: ToolUseBlock) {
    this.context = {
      initialMessage,
      toolCall,
      schemaContext: {},
      stateContext: {},
      history: [],
    };
  }

  public addHistory(history: Message[]): this {
    this.context.history = history;
    return this;
  }

  public addSchemaContext(schemaRegistry: SchemaRegistry): this {
    this.context.schemaContext = schemaRegistry;
    return this;
  }

  public addStateContext(stateManager: StateManager): this {
    this.context.stateContext = stateManager;
    return this;
  }

  public build(): ValidationContext {
    return {
      initialMessage: this.context.initialMessage,
      toolCall: this.context.toolCall,
      schemaContext: this.context.schemaContext,
      stateContext: this.context.stateContext,
      history: this.context.history,
    };
  }
}