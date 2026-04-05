import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type FlowControlEdgeType = "sequential" | "conditional" | "loop_exit" | "default";

export interface FlowEdge {
  fromNodeId: string;
  toNodeId: string;
  type: FlowControlEdgeType;
  condition?: string;
}

export interface GraphNode {
  id: string;
  type: "start" | "tool_call" | "flow";
  metadata: Record<string, any>;
  content: ContentBlock[];
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: FlowEdge[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV153 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private getNodeMermaidId(node: GraphNode): string {
    return node.id;
  }

  private getFlowNodeMermaidSyntax(node: GraphNode): string {
    if (node.type !== "flow") {
      return "";
    }
    const id = this.getNodeMermaidId(node);
    return `${id}["Flow Control: ${node.metadata.description || "Process Flow"}"],`;
  }

  private getToolCallNodeMermaidSyntax(node: GraphNode): string {
    if (node.type !== "tool_call") {
      return "";
    }
    const id = this.getNodeMermaidId(node);
    const toolUse = node.content.find((block): block is ToolUseBlock => block.type === "tool_use");
    if (!toolUse) {
      return `${id}["Tool Call: ${node.metadata.name || "Unknown Tool"}"]`;
    }
    return `${id}["Tool Call: ${toolUse.name} (ID: ${toolUse.id})"]`;
  }

  private getStartNodeMermaidSyntax(node: GraphNode): string {
    if (node.type !== "start") {
      return "";
    }
    const id = this.getNodeMermaidId(node);
    return `${id}["Start"]`;
  }

  private generateNodeSyntax(nodes: GraphNode[]): string {
    let nodeSyntax = "";
    for (const node of nodes) {
      if (node.type === "flow") {
        nodeSyntax += this.getFlowNodeMermaidSyntax(node);
      } else if (node.type === "tool_call") {
        nodeSyntax += this.getToolCallNodeMermaidSyntax(node);
      } else if (node.type === "start") {
        nodeSyntax += this.getStartNodeMermaidSyntax(node);
      }
    }
    return nodeSyntax.trim() + "\n";
  }

  private getEdgeMermaidSyntax(edges: FlowEdge[]): string {
    let edgeSyntax = "";
    for (const edge of edges) {
      const { fromNodeId, toNodeId, type, condition } = edge;
      let edgeDefinition = `${fromNodeId} --> ${toNodeId}`;

      let style = "";
      let label = "";

      switch (type) {
        case "conditional":
          style = "style";
          label = condition || "Condition";
          edgeDefinition = `${fromNodeId} -- "${label}" --> ${toNodeId}`;
          break;
        case "loop_exit":
          style = "style";
          label = "Exit Loop";
          edgeDefinition = `${fromNodeId} -- "${label}" --> ${toNodeId}`;
          break;
        case "sequential":
          style = "style";
          label = "";
          edgeDefinition = `${fromNodeId} --> ${toNodeId}`;
          break;
        case "default":
          style = "style";
          label = "Default";
          edgeDefinition = `${fromNodeId} -- "${label}" --> ${toNodeId}`;
          break;
      }

      // Apply advanced styling based on type
      if (type === "conditional") {
        edgeSyntax += `${fromNodeId} -- "${condition || "Condition"}" --> ${toNodeId} [class=conditional_edge];\n`;
      } else if (type === "loop_exit") {
        edgeSyntax += `${fromNodeId} -- "Loop Exit" --> ${toNodeId} [class=loop_exit_edge];\n`;
      } else if (type === "default") {
        edgeSyntax += `${fromNodeId} -- "Default" --> ${toNodeId} [class=default_edge];\n`;
      } else {
        edgeSyntax += `${fromNodeId} --> ${toNodeId};\n`;
      }
    }
    return edgeSyntax.trim();
  }

  public renderMermaidGraph(): string {
    const nodeSyntax = this.generateNodeSyntax(this.graph.nodes);
    const edgeSyntax = this.getEdgeMermaidSyntax(this.graph.edges);

    const mermaidGraph = `graph TD\n${nodeSyntax}\n${edgeSyntax}\n%% Styling for advanced flow control\nclassDef conditional_edge stroke:#ff9800,stroke-width:2px;\nclassDef loop_exit_edge stroke:#f44336,stroke-width:2px;\nclassDef default_edge stroke:#2196f3,stroke-width:2px;`;

    return mermaidGraph;
  }
}