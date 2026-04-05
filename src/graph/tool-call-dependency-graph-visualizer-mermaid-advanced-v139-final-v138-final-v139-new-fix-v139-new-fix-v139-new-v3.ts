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

interface GraphNode {
  id: string;
  label: string;
  type: "start" | "tool_call" | "conditional" | "end";
  details?: Record<string, any>;
}

interface GraphEdge {
  fromId: string;
  toId: string;
  condition?: string;
  label: string;
}

interface GraphContext {
  nodes: GraphNode[];
  edges: GraphEdge[];
  messages: Message[];
}

export class ToolCallDependencyGraphVisualizer {
  private readonly graphContext: GraphContext;

  constructor(context: GraphContext) {
    this.graphContext = context;
  }

  private generateNodeMermaid(node: GraphNode): string {
    let content = `node${node.id}["${node.label}"]`;

    if (node.type === "tool_call") {
      const details = node.details as { toolName: string; toolId: string };
      content += `\n-- Tool: ${details.toolName} (${details.toolId}) --`;
    } else if (node.type === "conditional") {
      content += `\n-- Condition: ${node.details?.condition || "N/A"} --`;
    }

    return content;
  }

  private generateEdgeMermaid(edge: GraphEdge): string {
    let mermaid = `${edge.fromId} --> ${edge.toId}`;
    if (edge.condition) {
      mermaid += `{${edge.condition}}`;
    }
    if (edge.label) {
      mermaid += ` : ${edge.label}`;
    }
    return mermaid;
  }

  private generateMermaidGraph(context: GraphContext): string {
    let mermaid = "graph TD\n";

    // 1. Define Nodes
    const nodeDeclarations = context.nodes.map(this.generateNodeMermaid).join("\n");
    mermaid += "\n%% Nodes\n" + nodeDeclarations + "\n";

    // 2. Define Edges
    const edgeDeclarations = context.edges.map(this.generateEdgeMermaid).join("\n");
    mermaid += "\n%% Edges\n" + edgeDeclarations + "\n";

    // 3. Add advanced flow control structure (Conceptual placeholder for complex logic)
    // This section simulates advanced flow control directives if needed,
    // though Mermaid's core graph syntax handles most dependencies.
    if (context.nodes.some(n => n.type === "conditional")) {
      mermaid += "\n%% Advanced Flow Control Simulation (If/Else)\n";
      mermaid += "subgraph FlowControl\n";
      mermaid += "    A -->|Condition Check| B\n";
      mermaid += "    B -- True --> C[True Path]\n";
      mermaid += "    B -- False --> D[False Path]\n";
      mermaid += "end\n";
    }

    return mermaid.trim();
  }

  public generateMermaidGraph(context: GraphContext): string {
    return this.generateMermaidGraph(context);
  }
}