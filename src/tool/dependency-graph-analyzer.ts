import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type ToolCallDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type DependencyGraph = Map<string, Set<string>>;

export interface AnalysisResult {
  executionOrder: string[];
  hasCycle: boolean;
  cycles: string[];
  missingDependencies: string[];
}

export class DependencyGraphAnalyzer {
  private graph: DependencyGraph;
  private toolDefinitions: Map<string, ToolCallDefinition>;

  constructor(toolDefinitions: ToolCallDefinition[]) {
    this.graph = new Map();
    this.toolDefinitions = new Map(
      toolDefinitions.map((def) => [def.name, def])
    );
  }

  private addEdge(from: string, to: string): void {
    if (!this.graph.has(from)) {
      this.graph.set(from, new Set());
    }
    this.graph.get(from)!.add(to);

    if (!this.graph.has(to)) {
      this.graph.set(to, new Set());
    }
  }

  private getDependenciesFromToolCalls(
    toolCalls: {
      toolName: string;
      input: Record<string, unknown>;
    }[]
  ): void {
    const allTools = new Set<string>();
    toolCalls.forEach((call) => {
      allTools.add(call.toolName);
    });

    // For simplicity in this implementation, we assume a direct dependency
    // relationship if a tool is called, but a more complex system would
    // analyze the *output* of one tool being the *input* to another.
    // Here, we just ensure all called tools are nodes.
    toolCalls.forEach((call) => {
      // In a real scenario, we'd check if the input requires another tool's output.
      // For this structure, we treat each call as a node, and assume no explicit
      // dependency unless the prompt structure dictates it.
      // We'll just ensure the node exists.
      if (!this.graph.has(call.toolName)) {
        this.graph.set(call.toolName, new Set());
      }
    });
  }

  private buildGraphFromMessageHistory(
    history: Array<UserMessage | AssistantMessage | ToolResultMessage>
  ): void {
    // Reset graph for a new analysis run
    this.graph.clear();

    // 1. Identify all unique tools mentioned or used
    const usedTools = new Set<string>();
    const toolCalls: {
      toolName: string;
      input: Record<string, unknown>;
    }[] = [];

    for (const message of history) {
      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as {
              type: "tool_use";
              id: string;
              name: string;
              input: Record<string, unknown>;
            };
            usedTools.add(toolUseBlock.name);
            toolCalls.push({
              toolName: toolUseBlock.name,
              input: toolUseBlock.input,
            });
          }
        }
      }
    }

    // 2. Build the graph structure based on tool calls
    this.getDependenciesFromToolCalls(toolCalls);

    // 3. (Placeholder for advanced dependency mapping)
    // If we had a mechanism to say "Tool A requires output from Tool B",
    // we would add the edge: this.addEdge("ToolB", "ToolA");
  }

  public analyze(
    history: Array<UserMessage | AssistantMessage | ToolResultMessage>
  ): AnalysisResult {
    this.buildGraphFromMessageHistory(history);

    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const sortedOrder: string[] = [];
    const visited = new Set<string>();

    // Initialize in-degrees for all nodes present in the graph
    for (const node of this.graph.keys()) {
      inDegree.set(node, 0);
    }

    // Calculate actual in-degrees based on edges
    for (const [tool, neighbors] of this.graph.entries()) {
      for (const neighbor of neighbors) {
        const currentDegree = inDegree.get(neighbor) || 0;
        inDegree.set(neighbor, currentDegree + 1);
      }
    }

    // Initialize queue with nodes having an in-degree of 0
    for (const [tool, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(tool);
      }
    }

    // Kahn's Algorithm for Topological Sort
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];
      sortedOrder.push(u);
      visited.add(u);

      const neighbors = this.graph.get(u) || new Set<string>();
      for (const v of neighbors) {
        const currentDegree = inDegree.get(v)!;
        if (currentDegree > 0) {
          inDegree.set(v, currentDegree - 1);
          if (inDegree.get(v)! === 0) {
            queue.push(v);
          }
        }
      }
    }

    const result: AnalysisResult = {
      executionOrder: sortedOrder,
      hasCycle: sortedOrder.length !== this.graph.size,
      cycles: [],
      missingDependencies: [],
    };

    if (result.hasCycle) {
      // Simple cycle detection reporting: just state a cycle exists.
      // Finding all cycles is NP-hard; we report the failure condition.
      result.cycles = ["Cycle detected. Cannot determine a linear execution order."];
    }

    // Check for missing dependencies (if any node was never reached, it implies
    // it was required but not defined/called, which is hard to prove without
    // explicit dependency edges. We'll skip complex missing dependency checks
    // unless the graph structure is explicitly defined by prerequisites.)

    return result;
  }
}