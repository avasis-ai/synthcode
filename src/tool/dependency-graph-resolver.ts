import { Message, ToolUseBlock, TextBlock } from "./types";

interface ToolDefinition {
  name: string;
  inputs: Record<string, { description: string; type: string }>;
  outputs: Record<string, { description: string; type: string }>;
}

interface ToolCall {
  toolName: string;
  inputs: Record<string, unknown>;
}

interface Context {
  toolDefinitions: Record<string, ToolDefinition>;
  initialInputs: Record<string, unknown>;
}

type DependencyGraph = Map<string, Set<string>>;

export class ToolDependencyResolver {
  private toolCalls: ToolCall[];
  private context: Context;
  private graph: DependencyGraph;
  private inDegree: Map<string, number>;

  constructor(toolCalls: ToolCall[], context: Context) {
    this.toolCalls = toolCalls;
    this.context = context;
    this.graph = new Map();
    this.inDegree = new Map();
  }

  private initializeGraph(toolNames: Set<string>): void {
    for (const name of toolNames) {
      this.graph.set(name, new Set<string>());
      this.inDegree.set(name, 0);
    }
  }

  private addDependency(prerequisite: string, dependent: string): void {
    if (!this.graph.has(prerequisite) || !this.graph.has(dependent)) {
      throw new Error(`Unknown tool in dependency: ${prerequisite} -> ${dependent}`);
    }
    if (!this.graph.get(prerequisite)!.has(dependent)) {
      this.graph.get(prerequisite)!.add(dependent);
      this.inDegree.set(dependent, this.inDegree.get(dependent)! + 1);
    }
  }

  private buildGraph(): void {
    const toolNames = new Set<string>();
    for (const call of this.toolCalls) {
      toolNames.add(call.toolName);
    }
    this.initializeGraph(toolNames);

    // 1. Map inputs to dependencies
    for (let i = 0; i < this.toolCalls.length; i++) {
      const currentCall = this.toolCalls[i];
      const currentToolName = currentCall.toolName;

      // Check for dependencies on initial context inputs
      for (const [inputKey, value] of Object.entries(currentCall.inputs)) {
        if (this.context.initialInputs[inputKey] === undefined) {
          // Assume if it's not in initial context, it must come from a previous tool output
          // For simplicity in this resolver, we assume any input not in initialInputs
          // must be provided by a preceding tool in the execution sequence.
          // A full implementation would require tracking data flow explicitly.
          // Here, we treat all inputs as potentially dependent on *some* previous tool.
          // Since we don't know the data flow graph, we'll rely on the order for now,
          // but for a true DAG, we must find the source.
        }
      }

      // 2. Detect dependencies between tools (Simplified: assume sequential dependency if inputs overlap)
      // In a real scenario, we'd analyze which tool's output keys match the current tool's input keys.
      // For this implementation, we assume that if tool B uses an output key from tool A, A must precede B.
      for (let j = 0; j < i; j++) {
        const prerequisiteCall = this.toolCalls[j];
        const prerequisiteToolName = prerequisiteCall.toolName;

        // Simple heuristic: If the current tool uses an input key that matches an output key
        // of a previous tool, we establish a dependency.
        for (const [inputKey, value] of Object.entries(currentCall.inputs)) {
          // This check is highly simplified. A real resolver needs structured data flow.
          // We check if the input key matches any known output key of the prerequisite tool.
          const definition = this.context.toolDefinitions[prerequisiteToolName];
          if (definition && definition.outputs[inputKey]) {
            this.addDependency(prerequisiteToolName, currentToolName);
            break;
          }
        }
      }
    }
  }

  private topologicalSort(): string[] | null {
    const queue: string[] = [];
    const sortedOrder: string[] = [];
    const mutableInDegree = new Map(this.inDegree);

    // Initialize queue with nodes having an in-degree of 0
    for (const [toolName, degree] of this.inDegree.entries()) {
      if (degree === 0) {
        queue.push(toolName);
      }
    }

    while (queue.length > 0) {
      const u = queue.shift()!;
      sortedOrder.push(u);

      const neighbors = this.graph.get(u)!;
      for (const v of neighbors) {
        if (mutableInDegree.has(v)) {
          const newDegree = mutableInDegree.get(v)! - 1;
          mutableInDegree.set(v, newDegree);
          if (newDegree === 0) {
            queue.push(v);
          }
        }
      }
    }

    if (sortedOrder.length !== this.toolCalls.length) {
      return null; // Cycle detected or graph incomplete
    }

    return sortedOrder;
  }

  public resolveOrder(): { order: string[]; error: string | null } {
    try {
      this.buildGraph();
      const order = this.topologicalSort();

      if (order === null) {
        return { order: [], error: "Circular dependency detected in the tool calls." };
      }

      return { order: order, error: null };
    } catch (e) {
      return { order: [], error: (e as Error).message };
    }
  }
}