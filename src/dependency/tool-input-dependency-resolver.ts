import { Message, ToolUseBlock, TextBlock } from "./types";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  dependencies?: {
    toolName: string;
    outputKey: string;
  }[];
}

export interface ToolCall {
  toolName: string;
  input: Record<string, unknown>;
}

export interface ToolDependencyResolverContext {
  toolDefinitions: Record<string, ToolDefinition>;
  // Maps tool call ID (or name if unique) to its expected output content
  // For simplicity, we assume the output content will be available in the context
  // after execution, keyed by a predictable name or ID.
  // For this resolver, we focus on the *order* and *inputs*.
  // We'll assume the output of a tool call can be retrieved by its toolName
  // if it's the only one using that name, or by a specific ID if provided.
  // Since the prompt implies dependency on *output*, we'll simplify the context
  // to hold the results map.
  toolResults: Record<string, Record<string, unknown>>;
}

export interface ResolvedToolCall {
  toolCall: ToolCall;
  // Inputs needed for this tool call, derived from context results
  requiredInputs: Record<string, unknown>;
}

export class ToolDependencyResolver {
  private context: ToolDependencyResolverContext;

  constructor(context: ToolDependencyResolverContext) {
    this.context = context;
  }

  private getDependencies(toolName: string): {
    toolName: string;
    outputKey: string;
  }[] {
    const definition = this.context.toolDefinitions[toolName];
    return definition?.dependencies || [];
  }

  private buildGraph(toolCalls: ToolCall[]): Map<string, {
    dependencies: Set<string>;
    dependents: Set<string>;
    toolCall: ToolCall;
  }> {
    const graph = new Map<string, {
      dependencies: Set<string>;
      dependents: Set<string>;
      toolCall: ToolCall;
    }>();

    for (const toolCall of toolCalls) {
      const node: {
        dependencies: Set<string>;
        dependents: Set<string>;
        toolCall: ToolCall;
      } = {
        dependencies: new Set(),
        dependents: new Set(),
        toolCall: toolCall,
      };
      graph.set(toolCall.toolName, node);
    }

    // Populate dependencies and dependents based on definitions
    for (const toolCall of toolCalls) {
      const toolName = toolCall.toolName;
      const definition = this.context.toolDefinitions[toolName];
      if (definition?.dependencies) {
        for (const dep of definition.dependencies) {
          const dependencyToolName = dep.toolName;
          if (graph.has(dependencyToolName)) {
            // Current tool depends on dependencyToolName
            graph.get(toolName)!.dependencies.add(dependencyToolName);
            // Dependency tool has a dependent (the current tool)
            graph.get(dependencyToolName)!.dependents.add(toolName);
          }
        }
      }
    }
    return graph;
  }

  private topologicalSort(graph: Map<string, {
    dependencies: Set<string>;
    dependents: Set<string>;
    toolCall: ToolCall;
  }>): string[] {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const sortedOrder: string[] = [];

    // 1. Calculate in-degrees
    for (const [toolName, node] of graph.entries()) {
      inDegree.set(toolName, node.dependencies.size);
    }

    // 2. Initialize queue with nodes having 0 in-degree
    for (const [toolName, node] of graph.entries()) {
      if (inDegree.get(toolName) === 0) {
        queue.push(toolName);
      }
    }

    // 3. Process queue
    while (queue.length > 0) {
      const uName = queue.shift()!;
      sortedOrder.push(uName);

      const uNode = graph.get(uName)!;

      // For every node v that depends on u
      for (const vName of uNode.dependents) {
        const vNode = graph.get(vName)!;
        // Decrement in-degree of v
        const newDegree = (inDegree.get(vName) || 0) - 1;
        inDegree.set(vName, newDegree);

        // If in-degree becomes 0, add to queue
        if (newDegree === 0) {
          queue.push(vName);
        }
      }
    }

    // Check for cycle
    if (sortedOrder.length !== graph.size) {
      throw new Error("Circular dependency detected among tools.");
    }

    return sortedOrder;
  }

  public resolve(toolCalls: ToolCall[]): {
    executionOrder: ToolCall[];
    resolvedInputs: Record<string, Record<string, unknown>>;
  } {
    if (toolCalls.length === 0) {
      return { executionOrder: [], resolvedInputs: {} };
    }

    const graph = this.buildGraph(toolCalls);
    const orderedToolNames = this.topologicalSort(graph);

    const executionOrder: ToolCall[] = [];
    const resolvedInputs: Record<string, Record<string, unknown>> = {};

    // Reconstruct the ordered list of ToolCalls
    for (const toolName of orderedToolNames) {
      const node = graph.get(toolName)!;
      executionOrder.push(node.toolCall);
    }

    // Determine required inputs for the sorted sequence
    for (const toolCall of executionOrder) {
      const toolName = toolCall.toolName;
      const definition = this.context.toolDefinitions[toolName];
      const requiredInputs: Record<string, unknown> = {};

      if (definition?.dependencies) {
        for (const dep of definition.dependencies) {
          const dependencyToolName = dep.toolName;
          const outputKey = dep.outputKey;

          // In a real system, we'd look up the actual result from the context.
          // Here, we assume the result for the dependency tool is available
          // and that the outputKey matches a field in that result.
          const dependencyResult = this.context.toolResults[dependencyToolName];

          if (dependencyResult && dependencyResult[outputKey] !== undefined) {
            requiredInputs[outputKey] = dependencyResult[outputKey];
          } else {
            // If dependency output is missing, we might fail or use a default.
            // For this resolver, we'll just record it as missing/unknown.
            requiredInputs[outputKey] = undefined;
          }
        }
      }
      // Store the resolved inputs for this specific tool call
      resolvedInputs[toolName] = requiredInputs;
    }

    return {
      executionOrder: executionOrder,
      resolvedInputs: resolvedInputs,
    };
  }
}