import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../types";

export type SemanticRelationship = "is_related_to" | "contradicts" | "supports" | "causes" | "is_part_of";

export interface SemanticEdge {
  sourceNodeId: string;
  targetNodeId: string;
  relationship: SemanticRelationship;
  confidence: number;
  description: string;
}

export interface GraphNode {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: Float32Array;
}

export class SemanticGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Set<SemanticEdge> = new Set();

  addNode(node: GraphNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with ID ${node.id} already exists.`);
    }
    this.nodes.set(node.id, node);
  }

  addEdge(edge: SemanticEdge): void {
    const edgeKey = `${edge.sourceNodeId}->${edge.targetNodeId}:${edge.relationship}`;
    if (this.edges.has(edgeKey)) {
      return;
    }
    this.edges.add(edgeKey);
  }

  ingestContext(messages: Array<UserMessage | AssistantMessage | ToolResultMessage>): void {
    const nodeMap = new Map<string, GraphNode>();
    let nodeIdCounter = 0;

    for (const message of messages) {
      let contentText: string = "";
      if (message.role === "user") {
        contentText = message.content.map((block) => {
          if (block.type === "text") return block.text;
          return "";
        }).join(" ");
      } else if (message.role === "assistant") {
        contentText = message.content.map((block) => {
          if (block.type === "text") return block.text;
          return "";
        }).join(" ");
      } else if (message.role === "tool") {
        contentText = `Tool Result (${message.tool_use_id}): ${message.content}`;
      }

      if (contentText.trim()) {
        const nodeId = `node_${nodeIdCounter++}`;
        const node: GraphNode = {
          id: nodeId,
          content: contentText,
          metadata: { role: message.role },
          embedding: new Float32Array(32), // Placeholder for actual embedding
        };
        this.addNode(node);
      }
    }
  }

  analyzeAndAddSemanticEdges(sourceId: string, targetId: string, relationship: SemanticRelationship, confidence: number, description: string): void {
    const edge: SemanticEdge = {
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      relationship: relationship,
      confidence: confidence,
      description: description,
    };
    this.addEdge(edge);
  }

  traverseSemantically(startNodeId: string, maxDepth: number): { nodes: GraphNode[]; edges: SemanticEdge[] } {
    const visitedNodes = new Set<string>();
    const queue: { nodeId: string; depth: number; path: GraphNode[] }[] = [{ nodeId: startNodeId, depth: 0, path: [] }];
    const foundNodes: GraphNode[] = [];
    const foundEdges: SemanticEdge[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visitedNodes.has(current.nodeId) && current.depth > 0) continue;

      visitedNodes.add(current.nodeId);
      current.path.push(this.nodes.get(current.nodeId)!);
      foundNodes.push(this.nodes.get(current.nodeId)!);

      if (current.depth >= maxDepth) continue;

      const neighbors = this.getNeighbors(current.nodeId);
      for (const neighbor of neighbors) {
        if (!visitedNodes.has(neighbor.nodeId)) {
          queue.push({ nodeId: neighbor.nodeId, depth: current.depth + 1, path: [...current.path] });
        }
      }
    }

    // Simplified edge collection for demonstration
    const uniqueEdges: Set<string> = new Set<string>();
    const collectedEdges: SemanticEdge[] = [];

    for (const edge of this.edges) {
      const key = `${edge.sourceNodeId}-${edge.targetNodeId}`;
      if (!uniqueEdges.has(key)) {
        collectedEdges.push(edge);
        uniqueEdges.add(key);
      }
    }

    return { nodes: foundNodes, edges: collectedEdges };
  }

  private getNeighbors(nodeId: string): GraphNode[] {
    const neighbors: Map<string, GraphNode> = new Map();
    for (const edge of this.edges) {
      if (edge.sourceNodeId === nodeId) {
        if (!neighbors.has(edge.targetNodeId)) {
          neighbors.set(edge.targetNodeId, this.nodes.get(edge.targetNodeId)!);
        }
      }
    }
    return Array.from(neighbors.values());
  }
}