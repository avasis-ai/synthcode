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

export interface ToolCallDependencyGraphMetadata {
  tool_call_id: string;
  tool_name: string;
  input_params: Record<string, unknown>;
  preconditions: string[];
  success_path: string;
  error_path: string;
  description: string;
}

export interface DependencyEdge {
  source_id: string;
  target_id: string;
  relationship: "calls" | "depends_on" | "follows" | "error_path";
  metadata: Partial<ToolCallDependencyGraphMetadata>;
}

export interface GraphNode {
  id: string;
  type: "user_input" | "assistant_thought" | "tool_call" | "tool_result";
  metadata: Record<string, unknown>;
}

export interface ToolCallDependencyGraph {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

export class ToolCallDependencyGraphVisualizer {
  private graph: ToolCallDependencyGraph;

  constructor(graph: ToolCallDependencyGraph) {
    this.graph = graph;
  }

  private generateNodeMermaid(node: GraphNode): string {
    let content = "";
    let shape = "rounded";

    switch (node.type) {
      case "user_input":
        content = `User Input: ${node.metadata["content"] || "N/A"}`;
        shape = "rect";
        break;
      case "assistant_thought":
        content = `Thought: ${node.metadata["thinking"] || "N/A"}`;
        shape = "rhombus";
        break;
      case "tool_call":
        const toolCall = node.metadata as {
          tool_name: string;
          input_params: Record<string, unknown>;
        };
        content = `Tool: ${toolCall.tool_name}\nInput: ${JSON.stringify(toolCall.input_params)}`;
        shape = "stadium";
        break;
      case "tool_result":
        const result = node.metadata as {
          content: string;
          is_error: boolean;
        };
        const status = result.is_error ? "ERROR" : "SUCCESS";
        content = `Tool Result (${status}): ${result.content.substring(0, 50)}...`;
        shape = "rect";
        break;
    }

    return `    ${node.id}["${content}"]:::${node.type.toLowerCase()}`;
  }

  private generateEdgeMermaid(edge: DependencyEdge): string {
    let relationshipSyntax = "";
    let label = "";

    switch (edge.relationship) {
      case "calls":
        relationshipSyntax = "-->";
        label = "Calls";
        break;
      case "depends_on":
        relationshipSyntax = "-->";
        label = "Depends On";
        break;
      case "follows":
        relationshipSyntax = "-->";
        label = "Follows";
        break;
      case "error_path":
        relationshipSyntax = "--->";
        label = "Error Path";
        break;
    }

    const metadata = edge.metadata;
    let metaDetail = "";
    if (metadata) {
      metaDetail = ` (Meta: ${metadata.tool_name || 'N/A'} -> ${metadata.description || ''})`;
    }

    return `    ${edge.source_id} ${relationshipSyntax} ${edge.target_id} ${metaDetail}`;
  }

  public renderMermaid(diagramType: "graph TD"): string {
    let mermaid = `graph ${diagramType}\n`;

    // 1. Define Styles (Classes)
    mermaid += `classDef user_input fill:#bbf,stroke:#333,stroke-width:2px;\n`;
    mermaid += `classDef assistant_thought fill:#ffc,stroke:#333,stroke-width:2px;\n`;
    mermaid += `classDef tool_call fill:#ccf,stroke:#333,stroke-width:2px;\n`;
    mermaid += `classDef tool_result fill:#cfc,stroke:#333,stroke-width:2px;\n`;

    // 2. Define Nodes
    const nodeDeclarations = this.graph.nodes.map(this.generateNodeMermaid.bind(this)).join('\n');
    mermaid += "\n" + nodeDeclarations + "\n";

    // 3. Define Edges
    const edgeDeclarations = this.graph.edges.map(this.generateEdgeMermaid.bind(this)).join('\n');
    mermaid += "\n" + edgeDeclarations + "\n";

    return mermaid;
  }
}

export function generateToolCallDependencyGraphMermaid(graph: ToolCallDependencyGraph): string {
  const visualizer = new ToolCallDependencyGraphVisualizer(graph);
  return visualizer.renderMermaid("graph TD");
}