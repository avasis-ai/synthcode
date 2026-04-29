import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface CapabilityNode {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, any>;
}

export interface CapabilityEdge {
  sourceId: string;
  targetId: string;
  type: "DEPENDS_ON" | "SUPPORTS" | "REQUIRES";
  strength: number;
  metadata: Record<string, any>;
}

export interface DependencyGraph {
  nodes: CapabilityNode[];
  edges: CapabilityEdge[];
}

export class ToolCapabilityDependencyGraphVisualizer {
  private capabilities: CapabilityNode[];
  private dependencies: CapabilityEdge[];

  constructor(capabilities: CapabilityNode[], dependencies: CapabilityEdge[]) {
    this.capabilities = capabilities;
    this.dependencies = dependencies;
  }

  public buildGraph(): DependencyGraph {
    return {
      nodes: this.capabilities,
      edges: this.dependencies,
    };
  }

  public visualizeGraph(graph: DependencyGraph): string {
    const nodeCount = graph.nodes.length;
    const edgeCount = graph.edges.length;

    if (nodeCount === 0) {
      return "No capabilities found to visualize.";
    }

    let visualizationInstructions = `Graph Visualization Payload Generated:\n`;
    visualizationInstructions += `Total Nodes (Capabilities): ${nodeCount}\n`;
    visualizationInstructions += `Total Edges (Dependencies): ${edgeCount}\n\n`;

    visualizationInstructions += "--- Nodes ---\n";
    graph.nodes.forEach((node, index) => {
      visualizationInstructions += `[${index + 1}] ID: ${node.id}, Name: ${node.name}, Desc: ${node.description.substring(0, 30)}...\n`;
    });

    visualizationInstructions += "\n--- Edges ---\n";
    graph.edges.forEach((edge, index) => {
      visualizationInstructions += `[${index + 1}] ${edge.sourceId} --(${edge.type}, Strength: ${edge.strength.toFixed(2)})--> ${edge.targetId}\n`;
    });

    visualizationInstructions += "\nVisualization Ready: Use a graph rendering engine (e.g., D3.js, Cytoscape.js) with the provided payload structure.";

    return visualizationInstructions;
  }
}

export function createDependencyGraphVisualizer(
  capabilities: CapabilityNode[],
  dependencies: CapabilityEdge[]
): ToolCapabilityDependencyGraphVisualizer {
  return new ToolCapabilityDependencyGraphVisualizer(capabilities, dependencies);
}