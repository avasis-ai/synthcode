import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type CapabilityName = string;
export type ToolId = string;

export interface TransformationContext {
  sourceToolId: ToolId;
  sourceCapability: CapabilityName;
  targetToolId: ToolId;
  targetCapability: CapabilityName;
  description: string;
}

export interface CapabilityEdge {
  sourceCapability: CapabilityName;
  targetCapability: CapabilityName;
  context: TransformationContext;
}

export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  inputCapabilities: Record<CapabilityName, { description: string; required: boolean }>;
  outputCapabilities: Record<CapabilityName, { description: string; produces: boolean }>;
}

export interface CapabilityGraph {
  edges: CapabilityEdge[];
  nodes: Set<CapabilityName>;
}

export class CapabilityGraphBuilder {
  private toolDefinitions: Map<ToolId, ToolDefinition>;
  private edges: CapabilityEdge[] = [];

  constructor(toolDefinitions: ToolDefinition[]) {
    this.toolDefinitions = new Map(toolDefinitions.map(t => [t.id, t]));
  }

  build(potentialEdges: CapabilityEdge[]): CapabilityGraph {
    this.edges = potentialEdges;

    const nodesSet = new Set<CapabilityName>();
    for (const edge of this.edges) {
      nodesSet.add(edge.sourceCapability);
      nodesSet.add(edge.targetCapability);
    }

    return {
      edges: this.edges,
      nodes: nodesSet,
    };
  }
}

export interface GraphVisualizer {
  visualize(graph: CapabilityGraph): string;
}

export class SimpleGraphVisualizer implements GraphVisualizer {
  visualize(graph: CapabilityGraph): string {
    let output = "--- Capability Graph Visualization ---\n";
    output += `Total Capabilities (Nodes): ${graph.nodes.size}\n`;
    output += `Total Dependencies (Edges): ${graph.edges.length}\n\n`;

    output += "--- Edges (Capability Flow) ---\n";
    for (const edge of graph.edges) {
      output += `[${edge.sourceCapability}] --(${edge.context.description})--> [${edge.targetCapability}]\n`;
      output += `  Via: ${edge.context.sourceToolId} -> ${edge.context.targetToolId}\n`;
    }
    return output;
  }
}

export {
  CapabilityGraphBuilder,
  SimpleGraphVisualizer,
  CapabilityGraph,
  CapabilityEdge,
  ToolDefinition,
}