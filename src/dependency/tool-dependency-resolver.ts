import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ToolDefinition {
  name: string;
  description: string;
  dependencies: string[];
  execute: (input: Record<string, unknown>) => Promise<any>;
}

export interface ToolCall {
  toolName: string;
  input: Record<string, unknown>;
}

export type ExecutionPlan = ToolCall[];

export class ToolDependencyResolver {
  private toolRegistry: Map<string, ToolDefinition>;

  constructor(toolDefinitions: ToolDefinition[]) {
    this.toolRegistry = new Map(
      toolDefinitions.map((def) => [def.name, def])
    );
  }

  private getToolDefinition(toolName: string): ToolDefinition | undefined {
    return this.toolRegistry.get(toolName);
  }

  private buildGraph(toolCalls: ToolCall[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    const requiredTools = new Set<string>();

    for (const call of toolCalls) {
      requiredTools.add(call.toolName);
    }

    for (const toolName of requiredTools) {
      const definition = this.getToolDefinition(toolName);
      if (!definition) continue;

      const dependencies = new Set<string>();
      for (const depName of definition.dependencies) {
        dependencies.add(depName);
      }
      graph.set(toolName, dependencies);
    }
    return graph;
  }

  private topologicalSort(graph: Map<string, Set<string>>): string[] | null {
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();
    const sortedOrder: string[] = [];

    const visit = (node: string) => {
      if (recursionStack.has(node)) {
        throw new Error(`Circular dependency detected involving tool: ${node}`);
      }
      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      const dependencies = graph.get(node);
      if (dependencies) {
        for (const dependency of dependencies) {
          if (!visited.has(dependency)) {
            visit(dependency);
          }
        }
      }

      recursionStack.delete(node);
      sortedOrder.push(node);
    };

    // We need to ensure all required tools are considered, even if they are not dependencies of others.
    // The sort order should be: dependencies first, then the tools that depend on them.
    const allTools = Array.from(graph.keys());
    for (const toolName of allTools) {
      if (!visited.has(toolName)) {
        visit(toolName);
      }
    }

    // The topological sort naturally places dependencies before the nodes that require them.
    // Since we are building the graph based on dependencies, the resulting order is correct.
    return sortedOrder;
  }

  public resolveOrder(toolCalls: ToolCall[]): ExecutionPlan | null {
    if (toolCalls.length === 0) {
      return [];
    }

    const graph = this.buildGraph(toolCalls);

    try {
      const orderedToolNames = this.topologicalSort(graph);

      if (orderedToolNames === null) {
        return null; // Should be caught by exception in visit
      }

      const executionPlan: ToolCall[] = [];
      const nameToIndex = new Map<string, number>();
      toolCalls.forEach((call, index) => {
        nameToIndex.set(call.toolName, index);
      });

      // Map the resolved order back to the original tool calls, respecting the input structure
      // if multiple calls exist for the same tool, we must preserve the intended call structure,
      // but for dependency resolution, we only care about the unique set of tools and their dependencies.
      // For simplicity and adhering to the graph structure, we will execute the unique set of tools
      // in the resolved order, using the input call's input data.

      const uniqueToolCalls: Map<string, ToolCall> = new Map();
      toolCalls.forEach(call => {
        if (!uniqueToolCalls.has(call.toolName)) {
          uniqueToolCalls.set(call.toolName, call);
        }
      });

      for (const toolName of orderedToolNames) {
        if (uniqueToolCalls.has(toolName)) {
          executionPlan.push(uniqueToolCalls.get(toolName)!);
        }
      }

      return executionPlan;
    } catch (e) {
      if (e instanceof Error && e.message.includes("Circular dependency")) {
        console.error(e.message);
        return null;
      }
      return null;
    }
  }
}