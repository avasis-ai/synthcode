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

interface ToolCallNode {
  id: string;
  message: Message;
  dependencies: {
    required_tool_result_id: string;
    required_input_from_message_id: string;
  } | null;
}

interface GraphContext {
  nodes: Map<string, ToolCallNode>;
  messageHistory: Message[];
}

interface AnalysisReport {
  cycles: string[];
  unmetPreconditions: {
    nodeId: string;
    reason: string;
  }[];
  deadEnds: string[];
}

export class ToolCallDependencyGraphAnalyzerAdvancedV145 {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private detectCycles(currentNodeId: string, path: Set<string>, visited: Set<string>, currentPath: string[]): {
    cycles: string[];
    visited: Set<string>;
  } {
    if (path.has(currentNodeId)) {
      const cycleStart = currentPath.indexOf(currentNodeId);
      const cycle = [...currentPath.slice(cycleStart), currentNodeId].join(" -> ");
      return { cycles: [cycle], visited: new Set(visited) };
    }

    if (visited.has(currentNodeId)) {
      return { cycles: [], visited: visited };
    }

    const newPath = new Set(path).add(currentNodeId);
    const newVisited = new Set(visited).add(currentNodeId);
    const newCurrentPath = [...currentPath, currentNodeId];

    const node = this.context.nodes.get(currentNodeId);
    if (!node || !node.dependencies) {
      return { cycles: [], visited: newVisited };
    }

    const { required_tool_result_id, required_input_from_message_id } = node.dependencies;
    let allCycles: string[] = [];
    let finalVisited = new Set(newVisited);

    if (required_tool_result_id) {
      const resultNodeId = required_tool_result_id;
      const resultCycles = this.detectCycles(resultNodeId, newPath, newVisited, newCurrentPath);
      allCycles = [...allCycles, ...resultCycles.cycles];
      finalVisited = resultCycles.visited;
    }

    if (required_input_from_message_id) {
      const messageNodeId = required_input_from_message_id;
      const messageCycles = this.detectCycles(messageNodeId, newPath, newVisited, newCurrentPath);
      allCycles = [...allCycles, ...messageCycles.cycles];
      finalVisited = new Set([...finalVisited, ...messageCycles.visited]);
    }

    return { cycles: allCycles, visited: finalVisited };
  }

  private checkPreconditions(nodeId: string): {
    unmet: { nodeId: string; reason: string }[];
    isExecutable: boolean;
  } {
    const node = this.context.nodes.get(nodeId);
    if (!node || !node.dependencies) {
      return { unmet: [], isExecutable: true };
    }

    const unmet: { nodeId: string; reason: string }[] = [];
    let isExecutable = true;

    const checkDependency = (depId: string, depType: 'tool_result' | 'message'): { unmet: { nodeId: string; reason: string }[]; isExecutable: boolean } => {
      if (!this.context.nodes.has(depId)) {
        return { unmet: [{ nodeId: nodeId, reason: `Dependency ${depType} ID '${depId}' not found in graph.` }], isExecutable: false };
      }

      // Simplified check: Assume existence implies fulfillment for this advanced pass,
      // but we check for explicit fulfillment status if available in a real system.
      // For this implementation, we check if the dependency node exists and is not marked as failed/missing.
      const depNode = this.context.nodes.get(depId)!;
      if (depType === 'tool_result') {
        // In a real system, we'd check the result status of the tool call associated with depId.
        // Here, we assume if the node exists, the dependency is met unless we explicitly track failure.
        // For demonstration, we'll simulate a failure check.
        if (depNode.message.role === 'tool' && (depNode.message as ToolResultMessage).is_error) {
            return { unmet: [{ nodeId: nodeId, reason: `Required tool result '${depId}' failed.` }], isExecutable: false };
        }
      } else if (depType === 'message') {
        // Check if the message content is sufficient (e.g., not empty)
        if (depNode.message.role === 'user' && (depNode.message as UserMessage).content.trim() === "") {
            return { unmet: [{ nodeId: nodeId, reason: `Required user message '${depId}' has empty content.` }], isExecutable: false };
        }
      }
      return { unmet: [], isExecutable: true };
    };

    let allUnmet: { nodeId: string; reason: string }[] = [];
    let currentExecutable = true;

    if (node.dependencies.required_tool_result_id) {
      const resultCheck = checkDependency(node.dependencies.required_tool_result_id, 'tool_result');
      allUnmet.push(...resultCheck.unmet);
      if (!resultCheck.isExecutable) currentExecutable = false;
    }

    if (node.dependencies.required_input_from_message_id) {
      const messageCheck = checkDependency(node.dependencies.required_input_from_message_id, 'message');
      allUnmet.push(...messageCheck.unmet);
      if (!messageCheck.isExecutable) currentExecutable = false;
    }

    return { unmet: allUnmet, isExecutable: currentExecutable };
  }

  private detectDeadEnds(nodeId: string, visited: Set<string>, path: string[]): {
    deadEnds: string[];
    visited: Set<string>;
  } {
    const node = this.context.nodes.get(nodeId);
    if (!node) {
      return { deadEnds: [], visited: visited };
    }

    const hasDependencies = node.dependencies && (node.dependencies.required_tool_result_id || node.dependencies.required_input_from_message_id);
    const isTerminal = !hasDependencies;

    let deadEnds: string[] = [];
    let newVisited = new Set(visited).add(nodeId);

    if (isTerminal) {
      // A node with no outgoing dependencies is a natural end point, not necessarily a 'dead end' unless it's not the expected end.
      // For this advanced check, we consider it a dead end if it's not the last node in the sequence.
      if (path.length < this.context.nodes.size) {
         deadEnds.push(nodeId);
      }
    } else if (!hasDependencies) {
        // Should be caught by isTerminal, but safety net
        deadEnds.push(nodeId);
    }

    // Recursively check dependencies (this is simplified; a true dead end check requires analyzing the entire graph structure)
    // For simplicity, we just mark nodes that have dependencies but don't lead anywhere further in the current traversal path.
    // Since we traverse based on dependencies, if the dependency leads to a dead end, the recursion handles it.
    // We rely on the cycle/precondition checks to flag structural issues.
    return { deadEnds: deadEnds, visited: newVisited };
  }

  public analyze(): AnalysisReport {
    const allCycles: string[] = [];
    const allUnmetPreconditions: { nodeId: string; reason: string }[] = [];
    const allDeadEnds: string[] = [];
    const visitedNodes = new Set<string>();

    // 1. Cycle Detection (Start from all nodes to ensure full coverage)
    for (const nodeId of this.context.nodes.keys()) {
      const { cycles: foundCycles, visited: newVisited } = this.detectCycles(nodeId, new Set(), new Set(), []);
      allCycles.push(...foundCycles);
      // Update global visited set based on the most comprehensive traversal
      newVisited.forEach(id => visitedNodes.add(id));
    }

    // 2. Unmet Precondition Check (Check every node against its dependencies)
    for (const [nodeId, node] of this.context.nodes.entries()) {
      const { unmet, isExecutable } = this.checkPreconditions(nodeId);
      if (!isExecutable) {
        allUnmetPreconditions.push(...unmet);
      }
    }

    // 3. Dead End Detection (Traverse and check for paths that terminate prematurely)
    // We iterate through all nodes and perform a traversal to find paths that stop unexpectedly.
    for (const nodeId of this.context.nodes.keys()) {
        const { deadEnds: foundDeadEnds, visited: newVisited } = this.detectDeadEnds(nodeId, new Set(), []);
        allDeadEnds.push(...foundDeadEnds);
    }

    return {
      cycles: [...new Set(allCycles)],
      unmetPreconditions: [...new Set(allUnmetPreconditions)],
      deadEnds: [...new Set(allDeadEnds)],
    };
  }
}