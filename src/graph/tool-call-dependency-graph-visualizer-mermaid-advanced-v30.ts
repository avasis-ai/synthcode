import {
  Message,
  ContentBlock,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface GraphNode {
  id: string;
  label: string;
  type: "user" | "assistant" | "tool";
  details: string;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV30 {
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];

  constructor() {}

  public addMessage(message: Message): void {
    if (message.role === "user") {
      this.nodes.push({
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        label: "User Input",
        type: "user",
        details: message.content.text,
      });
    } else if (message.role === "assistant") {
      const assistantNodeId = `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      this.nodes.push({
        id: assistantNodeId,
        label: "Assistant Response",
        type: "assistant",
        details: this.extractContentDetails(message.content),
      });
    } else if (message.role === "tool") {
      this.nodes.push({
        id: `tool_${message.tool_use_id}`,
        label: `Tool Result: ${message.tool_use_id}`,
        type: "tool",
        details: message.content,
      });
    }
  }

  private extractContentDetails(content: ContentBlock[]): string {
    let details = "";
    for (const block of content) {
      if (block.type === "text") {
        details += `Text: ${block.text}\n`;
      } else if (block.type === "tool_use") {
        details += `Tool Call: ${block.name}(${JSON.stringify(block.input)})\n`;
      } else if (block.type === "thinking") {
        details += `Thinking: ${block.thinking}\n`;
      }
    }
    return details.trim();
  }

  public addDependency(fromId: string, toId: string, label: string): void {
    this.edges.push({ from: fromId, to: toId, label });
  }

  public visualizeMermaidV30(): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes with V30 Syntax Support (e.g., custom shapes/subgraphs)
    const nodeDefinitions: Record<string, string> = {};
    this.nodes.forEach(node => {
      let shape = "([ ])"; // Default rounded box
      let classStyle = "";

      if (node.type === "user") {
        shape = "(( ))"; // Circle for user
        classStyle = "style " + node.id + " fill:#e6f7ff,stroke:#1890ff,stroke-width:2px";
      } else if (node.type === "assistant") {
        shape = "{[ ]}"; // Diamond for assistant
        classStyle = "style " + node.id + " fill:#fffbe6,stroke:#faad14,stroke-width:2px";
      } else if (node.type === "tool") {
        shape = "([ ])"; // Standard box for tool
        classStyle = "style " + node.id + " fill:#f6ffed,stroke:#52c41a,stroke-width:2px";
      }

      nodeDefinitions[node.id] = `${node.id}["${node.label}\\n(${node.type})"]${classStyle}`;
    });

    // 2. Assemble Node Definitions
    Object.values(nodeDefinitions).forEach(def => {
      mermaid += `${def}\n`;
    });

    // 3. Define Edges with V30 Syntax Support (e.g., specific link styles)
    this.edges.forEach(edge => {
      // Using V30 syntax for labeled arrows with specific link styles
      mermaid += `${edge.from} -- "${edge.label}" --> ${edge.to};\n`;
    });

    // 4. Add Graph Metadata/Title (Advanced Feature)
    mermaid += "\n%% Mermaid Graph Version 30 Advanced Visualization\n";
    mermaid += "%% Description: Tool Call Dependency Flow\n";

    return mermaid.trim();
  }
}