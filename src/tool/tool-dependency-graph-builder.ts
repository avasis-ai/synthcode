import { ToolUseBlock, TextBlock } from "./types";

export type ToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export interface DependencyGraph {
  nodes: Map<string, ToolCall>;
  adj: Map<string, Set<string>>;
  getDependencies(toolId: string): Set<string>;
}

export class ToolDependencyBuilder {
  private toolCalls: Map<string, ToolCall> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();

  constructor(initialToolCalls: ToolCall[]) {
    for (const call of initialToolCalls) {
      this.toolCalls.set(call.id, call);
    }
  }

  addToolCall(toolCall: ToolCall): this {
    if (this.toolCalls.has(toolCall.id)) {
      throw new Error(`Tool call with ID ${toolCall.id} already exists.`);
    }
    this.toolCalls.set(toolCall.id, toolCall);
    return this;
  }

  addDependency(sourceToolId: string, requiredInputFromToolId: string): this {
    if (!this.toolCalls.has(sourceToolId)) {
      throw new Error(`Source tool ID ${sourceToolId} not found.`);
    }
    if (!this.toolCalls.has(requiredInputFromToolId)) {
      throw new Error(`Required input tool ID ${requiredInputFromToolId} not found.`);
    }

    if (!this.dependencies.has(sourceToolId)) {
      this.dependencies.set(sourceToolId, new Set());
    }
    this.dependencies.get(sourceToolId)!.add(requiredInputFromToolId);
    return this;
  }

  build(): DependencyGraph {
    const nodes = new Map<string, ToolCall>(this.toolCalls);
    const adj = new Map<string, Set<string>>();

    for (const toolId of this.toolCalls.keys()) {
      adj.set(toolId, new Set());
    }

    for (const [sourceId, requiredInputs] of this.dependencies.entries()) {
      for (const requiredId of requiredInputs) {
        if (!adj.has(sourceId)) {
          adj.set(sourceId, new Set());
        }
        adj.get(sourceId)!.add(requiredId);
      }
    }

    return {
      nodes: nodes,
      adj: adj,
      getDependencies: (toolId: string): Set<string> => {
        return this.dependencies.get(toolId) || new Set();
      }
    };
  }
}