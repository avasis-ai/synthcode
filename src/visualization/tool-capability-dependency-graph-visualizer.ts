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

interface CapabilityNode {
  id: string;
  name: string;
  type: "tool" | "capability";
  description: string;
  is_missing?: boolean;
}

interface DependencyEdge {
  from: string;
  to: string;
  type: "requires" | "enables";
  description: string;
}

interface CapabilityDependencyGraph {
  nodes: CapabilityNode[];
  edges: DependencyEdge[];
}

export class ToolCapabilityDependencyGraphVisualizer {
  private graph: CapabilityDependencyGraph;

  constructor(graph: CapabilityDependencyGraph) {
    this.graph = graph;
  }

  public getGraph(): CapabilityDependencyGraph {
    return this.graph;
  }

  public visualize(rootToolId: string): {
    structure: any;
    highlightedGaps: { nodeId: string; reason: string }[];
  } {
    const { nodes, edges } = this.graph;
    const rootNode = nodes.find((node) => node.id === rootToolId);

    if (!rootNode) {
      return { structure: null, highlightedGaps: [] };
    }

    const dependencyTree: any[] = [];
    const gaps: { nodeId: string; reason: string }[] = [];

    // Simple traversal simulation for visualization structure
    const buildTree = (nodeId: string, parentId: string, depth: number): any => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return null;

      const children: any[] = [];
      const outgoingEdges = edges.filter((e) => e.from === nodeId);

      for (const edge of outgoingEdges) {
        const childNode = nodes.find((n) => n.id === edge.to);
        if (childNode) {
          const childTree = buildTree(childNode.id, nodeId, depth + 1);
          children.push({
            edge: { type: edge.type, description: edge.description },
            node: childNode,
            children: childTree,
          });
        }
      }

      return {
        id: node.id,
        name: node.name,
        type: node.type,
        description: node.description,
        is_missing: node.is_missing,
        children: children,
      };
    };

    dependencyTree.push(buildTree(rootToolId, "", 0));

    // Identify gaps (simplified: check for nodes marked as missing)
    const missingNodes = nodes.filter((node) => node.is_missing);
    const gapDetails = missingNodes.map((node) => ({
      nodeId: node.id,
      reason: `Capability '${node.name}' is required but currently unavailable or missing in the execution context.`,
    }));

    return {
      structure: dependencyTree,
      highlightedGaps: gapDetails,
    };
  }
}