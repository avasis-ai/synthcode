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

export interface DataFlowEdge {
  sourceToolId: string;
  targetToolId: string;
  dataKeys: string[];
}

export interface ToolNode {
  id: string;
  name: string;
  description: string;
  inputs: Record<string, unknown>;
  outputs: string[];
}

export interface DependencyGraph {
  nodes: ToolNode[];
  edges: DataFlowEdge[];
}

export class DynamicToolDependencyGraphVisualizer {
  private dataFlows: DataFlowEdge[];

  constructor(dataFlows: DataFlowEdge[]) {
    this.dataFlows = dataFlows;
  }

  private extractToolNodes(dataFlows: DataFlowEdge[]): Map<string, ToolNode> {
    const nodesMap = new Map<string, ToolNode>();

    for (const edge of dataFlows) {
      [edge.sourceToolId, edge.targetToolId].forEach((toolId) => {
        if (!nodesMap.has(toolId)) {
          const sourceBlock = this.findToolUseBlock(toolId);
          const name = sourceBlock ? sourceBlock.name : `Unknown Tool (${toolId})`;
          const description = sourceBlock ? `Used in context.` : `No specific context found.`;

          nodesMap.set(toolId, {
            id: toolId,
            name: name,
            description: description,
            inputs: sourceBlock ? sourceBlock.input : {},
            outputs: [],
          });
        }
      });
    }

    // Second pass to populate outputs based on edges
    for (const edge of dataFlows) {
      const sourceNode = nodesMap.get(edge.sourceToolId)!;
      if (!sourceNode.outputs.includes(edge.targetToolId)) {
        sourceNode.outputs.push(edge.targetToolId);
      }
    }

    return nodesMap;
  }

  private findToolUseBlock(toolId: string): ToolUseBlock | undefined {
    // Simplified: In a real scenario, we'd traverse the message history.
    // Here, we assume toolId maps directly to a known tool use ID for simplicity.
    // A proper implementation would scan the message history for tool_use blocks matching toolId.
    return {
      type: "tool_use",
      id: toolId,
      name: `Tool_${toolId.replace(/[^a-zA-Z0-9]/g, '')}`,
      input: { placeholder: "Input data structure" },
    } as ToolUseBlock;
  }

  public buildGraph(): DependencyGraph {
    const nodesMap = this.extractToolNodes(this.dataFlows);

    const nodes: ToolNode[] = Array.from(nodesMap.values());

    return {
      nodes: nodes,
      edges: this.dataFlows,
    };
  }

  public visualize(graph: DependencyGraph): void {
    console.log("--- Dependency Graph Visualization ---");
    console.log(`Nodes Found: ${graph.nodes.length}`);
    console.log(`Edges Found: ${graph.edges.length}`);

    graph.nodes.forEach(node => {
      console.log(`\n[NODE] ${node.name} (${node.id})`);
      console.log(`  Description: ${node.description}`);
      console.log(`  Inputs:`, node.inputs);
      console.log(`  Outputs (Connected To): ${node.outputs.join(', ')}`);
    });

    graph.edges.forEach((edge, index) => {
      console.log(`\n[EDGE ${index + 1}] ${edge.sourceToolId} --> ${edge.targetToolId}`);
      console.log(`  Data Flow Keys: ${edge.dataKeys.join(', ')}`);
    });
  }
}