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

export interface ToolCallDependencyMetadata {
  message: Message;
  tool_use_id: string;
  tool_name: string;
  input: Record<string, unknown>;
  status: "success" | "failure" | "pending";
  group: string;
}

export interface GraphNode {
  id: string;
  label: string;
  metadata: ToolCallDependencyMetadata;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  metadata: {
    type: "tool_call" | "response";
    status: "success" | "failure" | "pending";
  };
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV35 {
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];

  constructor() {}

  public addNode(node: GraphNode): void {
    this.nodes.push(node);
  }

  public addEdge(edge: GraphEdge): void {
    this.edges.push(edge);
  }

  private getNodeStyle(metadata: ToolCallDependencyMetadata): string {
    switch (metadata.status) {
      case "success":
        return "fill:#d4edda,stroke:#c3e6cb,stroke-width:2px";
      case "failure":
        return "fill:#f8d7da,stroke:#f5c6cb,stroke-width:2px";
      case "pending":
      default:
        return "fill:#fff3cd,stroke:#ffeeba,stroke-width:2px";
    }
  }

  private getEdgeStyle(metadata: { type: "tool_call" | "response"; status: "success" | "failure" | "pending" }): string {
    if (metadata.status === "failure") {
      return "stroke:red,stroke-dasharray: 5 5";
    }
    return "stroke:blue,stroke-width:2px";
  }

  private generateSubgraphDirectives(): string {
    const groups = new Set<string>();
    this.nodes.forEach(node => groups.add(node.metadata.group));

    let subgraphCode = "";
    groups.forEach(groupName => {
      subgraphCode += `subgraph ${groupName} "${groupName} Group"\n`;
    });
    return subgraphCode;
  }

  private generateNodeDirectives(): string {
    let nodeCode = "";
    this.nodes.forEach(node => {
      const style = this.getNodeStyle(node.metadata);
      const label = `Tool: ${node.metadata.tool_name}\\nInput: ${JSON.stringify(node.metadata.input).substring(0, 30)}...`;
      nodeCode += `${node.id}["${label}"]:::${node.metadata.group.toLowerCase().replace(/\s/g, '-')}\n`;
    });
    return nodeCode;
  }

  private generateEdgeDirectives(): string {
    let edgeCode = "";
    this.edges.forEach(edge => {
      const style = this.getEdgeStyle(edge.metadata);
      edgeCode += `${edge.fromId} -- "${edge.metadata.type}" --> ${edge.toId}:::${edge.metadata.type} ${style}\n`;
    });
    return edgeCode;
  }

  public generateMermaidCode(): string {
    let mermaid = "graph TD\n";

    mermaid += "%% --- Custom Styling Definitions ---\n";
    mermaid += "classDef success fill:#d4edda,stroke:#c3e6cb,stroke-width:2px;\n";
    mermaid += "classDef failure fill:#f8d7da,stroke:#f5c6cb,stroke-width:2px;\n";
    mermaid += "classDef pending fill:#fff3cd,stroke:#ffeeba,stroke-width:2px;\n";
    mermaid += "classDef tool-call stroke:blue,stroke-width:2px;\n";
    mermaid += "classDef response stroke:green,stroke-width:2px;\n";

    mermaid += "\n%% --- Subgraphs (Grouping) ---\n";
    mermaid += this.generateSubgraphDirectives();

    mermaid += "\n%% --- Nodes ---\n";
    mermaid += this.generateNodeDirectives();

    mermaid += "\n%% --- Edges ---\n";
    mermaid += this.generateEdgeDirectives();

    return mermaid;
  }
}