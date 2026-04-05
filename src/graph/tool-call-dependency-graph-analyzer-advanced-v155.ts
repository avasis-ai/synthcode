import { Graph, Node, Edge } from "./graph-structure";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_call"; tool_call_id: string };

export interface DependencyGraphAnalyzerReport {
  flawType: "CircularDependency" | "UnreachableState" | "ResourceContention" | "None";
  description: string;
  affectedNodes: string[];
  suggestedRemediation: string;
}

export class ToolCallDependencyGraphAnalyzerAdvancedV155 {
  private graph: Graph;

  constructor(graph: Graph) {
    this.graph = graph;
  }

  private detectCycles(startNodeId: string): { cycleFound: boolean; cyclePath: string[] } {
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();
    const path: string[] = [];

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = this.graph.getNode(nodeId);
      if (!node || !node.edges) return false;

      for (const edge of node.edges) {
        const neighborId = edge.targetId;
        if (recursionStack.has(neighborId)) {
          const cycleStart = path.indexOf(neighborId);
          return { cycleFound: true, cyclePath: path.slice(cycleStart) };
        }
        if (!visited.has(neighborId)) {
          const result = dfs(neighborId);
          if (result.cycleFound) return result;
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
      return { cycleFound: false, cyclePath: [] };
    };

    const result = dfs(startNodeId);
    return result;
  }

  private traceFallbackAndUnreachablePaths(startNodeId: string): { unreachable: boolean; path: string[] } {
    const reachable: Set<string> = new Set<string>();
    const queue: string[] = [startNodeId];
    const visited: Set<string> = new Set([startNodeId]);

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      reachable.add(nodeId);

      const node = this.graph.getNode(nodeId);
      if (!node || !node.edges) continue;

      for (const edge of node.edges) {
        const targetId = edge.targetId;
        if (!visited.has(targetId)) {
          visited.add(targetId);
          queue.push(targetId);
        }
      }
    }

    const allNodes = new Set<string>();
    this.graph.getAllNodeIds().forEach(id => allNodes.add(id));

    const unreachableNodes = Array.from(allNodes).filter(id => !reachable.has(id));

    return { unreachable: unreachableNodes.length > 0, path: unreachableNodes };
  }

  public analyze(): DependencyGraphAnalyzerReport {
    let bestReport: DependencyGraphAnalyzerReport = {
      flawType: "None",
      description: "No complex flaws detected.",
      affectedNodes: [],
      suggestedRemediation: "Execution flow appears sound based on current analysis.",
    };

    // 1. Cycle Detection (Tarjan's variation simulation)
    for (const nodeId of this.graph.getAllNodeIds()) {
      const { cycleFound, cyclePath } = this.detectCycles(nodeId);
      if (cycleFound) {
        return {
          flawType: "CircularDependency",
          description: `Circular dependency detected involving nodes: ${cyclePath.join(" -> ")}. This indicates a potential infinite loop or deadlock.`,
          affectedNodes: cyclePath,
          suggestedRemediation: "Review the conditional logic or tool call sequence between these nodes to ensure a clear exit path.",
        };
      }
    }

    // 2. Unreachable/Fallback Path Tracing
    const startNodeId = this.graph.getStartNodeId();
    if (startNodeId) {
      const { unreachable } = this.traceFallbackAndUnreachablePaths(startNodeId);
      if (unreachable.length > 0) {
        return {
          flawType: "UnreachableState",
          description: `The following nodes appear unreachable from the start state: ${unreachable.join(", ")}. This suggests an unhandled fallback path or dead end.`,
          affectedNodes: unreachable,
          suggestedRemediation: "Ensure all potential execution paths (e.g., error handling, fallback branches) explicitly connect to a final success or failure state.",
        };
      }
    }

    // 3. Resource Contention (Simplified check based on shared tool calls)
    const toolCallCounts: Map<string, number> = new Map();
    for (const node of this.graph.getAllNodes()) {
      if (node.type === "tool_call") {
        const toolCallId = node.data.tool_call_id;
        toolCallCounts.set(toolCallId, (toolCallCounts.get(toolCallId) || 0) + 1);
      }
    }

    const contentionNodes: string[] = [];
    for (const [id, count] of toolCallCounts.entries()) {
      if (count > 1) {
        contentionNodes.push(id);
      }
    }

    if (contentionNodes.length > 0) {
      return {
        flawType: "ResourceContention",
        description: `Multiple execution paths attempt to use the same resource/tool call ID (${contentionNodes.join(", ")}) concurrently or sequentially without proper state management.`,
        affectedNodes: contentionNodes,
        suggestedRemediation: "Implement explicit locking mechanisms or refactor the graph to serialize access to shared resources.",
      };
    }

    return bestReport;
  }
}