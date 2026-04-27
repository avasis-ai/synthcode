import { Message, ToolResultMessage } from "./types";

interface GraphNode {
  id: string;
  toolName: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  dependencies: string[];
}

export class ExecutionGraph {
  private nodes: Map<string, GraphNode>;

  constructor(initialNode: GraphNode) {
    this.nodes = new Map<string, GraphNode>();
    this.nodes.set(initialNode.id, initialNode);
  }

  private validateDataFlow(requiredId: string, availableOutputs: Map<string, unknown>): boolean {
    if (!availableOutputs.has(requiredId)) {
      return false;
    }
    return true;
  }

  public addNode(
    toolName: string,
    inputs: Record<string, unknown>,
    dependencies: string[]
  ): GraphNode {
    const newNodeId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const availableOutputs = new Map<string, unknown>();
    this.nodes.forEach((node, id) => {
      if (node.status === "COMPLETED") {
        availableOutputs.set(id, node.outputs);
      }
    });

    const canConnect = dependencies.every(depId => this.nodes.has(depId) && this.nodes.get(depId)!.status === "COMPLETED");

    if (!canConnect) {
      throw new Error(`Cannot add node ${toolName}: One or more dependencies (${dependencies.join(', ')}) are not yet completed.`);
    }

    const newNode: GraphNode = {
      id: newNodeId,
      toolName: toolName,
      inputs: inputs,
      outputs: {},
      status: "PENDING",
      dependencies: dependencies,
    };

    this.nodes.set(newNodeId, newNode);
    return newNode;
  }

  public updateNodeStatus(nodeId: string, status: GraphNode["status"], outputs: Record<string, unknown> = {}): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found.`);
    }

    node.status = status;
    if (status === "COMPLETED") {
      node.outputs = outputs;
    }
  }

  public detectCycles(): boolean {
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();

    const dfs = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true; // Cycle detected
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (dfs(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (dfs(nodeId)) {
        return true;
      }
    }
    return false;
  }

  public suggestParallelizationPoints(): string[] {
    const completedNodes = Array.from(this.nodes.values()).filter(n => n.status === "COMPLETED");
    const potentialStarts: string[] = [];

    for (const node of completedNodes) {
      const nextCandidates = Array.from(this.nodes.values()).filter(
        n => n.status === "PENDING" && n.dependencies.includes(node.id)
      );

      if (nextCandidates.length > 1) {
        potentialStarts.push(`Multiple nodes (${nextCandidates.map(n => n.toolName).join(', ')}) can start after ${node.toolName} completion.`);
      }
    }
    return potentialStarts;
  }
}