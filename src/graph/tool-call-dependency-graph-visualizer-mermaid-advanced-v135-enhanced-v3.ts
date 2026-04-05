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

type GraphNode = {
  id: string;
  type: "user" | "assistant" | "tool";
  content: string;
  metadata: Record<string, any>;
};

type GraphEdge = {
  fromId: string;
  toId: string;
  type: "call" | "response" | "conditional" | "loop";
  condition?: string;
};

interface VisualizerConfig {
  enableAdvancedFlowControl?: boolean;
}

class ToolCallDependencyGraphVisualizer {
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];
  private config: VisualizerConfig;

  constructor(config: VisualizerConfig = {}) {
    this.config = {
      enableAdvancedFlowControl: true,
      ...config,
    };
  }

  private _generateNodeId(message: Message, index: number): string {
    const prefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    return `${prefix}-${Math.random().toString(36).substring(2)}-${index}`;
  }

  private _processMessage(message: Message, index: number): GraphNode {
    let content = "";
    let nodeType: GraphNode["type"] = "assistant";

    if (message.role === "user") {
      nodeType = "user";
      content = message.content.text || message.content;
    } else if (message.role === "assistant") {
      nodeType = "assistant";
      const blocks = (message as AssistantMessage).content;
      if (blocks.some((block) => block.type === "tool_use")) {
        content = `Tool Calls: ${blocks.filter((b): b is ToolUseBlock => b.type === "tool_use").length} detected.`;
      } else if (blocks.some((block) => block.type === "thinking")) {
        content = `Thinking: ${blocks.filter((b): b is ThinkingBlock => b.type === "thinking").map(b => b.thinking).join(", ")}`;
      } else {
        content = blocks.map((block) => {
          if (block.type === "text") return block.text;
          if (block.type === "tool_use") return `Tool Use: ${block.name}`;
          if (block.type === "thinking") return `Thinking: ${block.thinking}`;
          return "";
        }).join(" ");
      }
    } else if (message.role === "tool") {
      nodeType = "tool";
      content = `Tool Result (${message.tool_use_id}): ${message.content}${message.is_error ? " [ERROR]" : ""}`;
    }

    return {
      id: this._generateNodeId(message, index),
      type: nodeType,
      content: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
      metadata: { role: message.role },
    };
  }

  private _addNode(node: GraphNode): void {
    this.nodes.push(node);
  }

  private _addEdge(fromId: string, toId: string, type: GraphEdge["type"], condition?: string): void {
    this.edges.push({ fromId, toId, type, condition });
  }

  public visualize(messages: Message[]): string {
    this.nodes = [];
    this.edges = [];

    let lastNodeId: string | null = null;

    messages.forEach((message, index) => {
      const node = this._processMessage(message, index);
      this._addNode(node);

      if (lastNodeId) {
        let edgeType: GraphEdge["type"] = "call";
        let condition: string | undefined = undefined;

        if (message.role === "tool") {
          edgeType = "response";
        } else if (message.role === "assistant" && index > 0) {
          // Simplified logic for flow control demonstration
          if (index > 1 && messages[index - 2]?.role === "user") {
            edgeType = "conditional";
            condition = "if condition met";
          }
        }

        this._addEdge(lastNodeId, node.id, edgeType, condition);
      }
      lastNodeId = node.id;
    });

    return this._generateMermaidSyntax();
  }

  private _generateMermaidSyntax(): string {
    let mermaid = "graph TD;\n";
    mermaid += "%% Advanced Tool Call Dependency Graph Visualization\n";

    const nodeMap = new Map<string, GraphNode>();
    this.nodes.forEach(node => nodeMap.set(node.id, node));

    // 1. Define Nodes
    this.nodes.forEach((node, index) => {
      let style = "";
      let shape = "rectangle";

      switch (node.type) {
        case "user":
          style = "fill:#ADD8E6,stroke:#333,stroke-width:2px";
          shape = "rounded";
          break;
        case "assistant":
          style = "fill:#90EE90,stroke:#333,stroke-width:2px";
          shape = "rounded";
          break;
        case "tool":
          style = "fill:#FFD700,stroke:#333,stroke-width:2px";
          shape = "hexagon";
          break;
      }

      const id = `N${index}`;
      mermaid += `  ${id}["${node.content}"]:::${node.type};\n`;
      mermaid += `  classDef ${node.type} fill-color: ${node.type === 'user' ? '#ADD8E6' : node.type === 'assistant' ? '#90EE90' : '#FFD700'}; \n`;
    });

    // 2. Define Edges
    this.edges.forEach((edge, index) => {
      let link = "";
      let label = "";
      let linkType = "-->";

      switch (edge.type) {
        case "call":
          link = "-->";
          label = "Calls";
          break;
        case "response":
          link = "-->";
          label = "Responds With";
          break;
        case "conditional":
          link = "-->";
          label = edge.condition || "Conditional Path";
          // Advanced Syntax: Use specific link style for conditional flow
          mermaid += `  ${edge.fromId} -- "${label}" --> ${edge.toId}:::conditional-branch;\n`;
          return;
        case "loop":
          link = "-->";
          label = "Loop Back";
          break;
      }

      if (link) {
        mermaid += `  ${edge.fromId} ${link} ${edge.toId}:::${edge.type};\n`;
      }
    });

    // 3. Advanced Flow Control Definitions (Mermaid Syntax Extensions)
    mermaid += "\n%% Advanced Flow Control Definitions\n";
    mermaid += "  classDef conditional-branch stroke-dasharray: 5 5, stroke: #FF6347;\n";
    mermaid += "  classDef loop-exit stroke-width:2px, stroke: #4682B4;\n";

    return mermaid;
  }
}

export { ToolCallDependencyGraphVisualizer };