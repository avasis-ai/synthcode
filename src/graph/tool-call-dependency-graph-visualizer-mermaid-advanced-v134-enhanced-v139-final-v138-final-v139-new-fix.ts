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

type NodeId = string;

interface GraphNode {
  id: NodeId;
  type: "user" | "assistant" | "tool_result";
  content: string;
}

interface DependencyGraph {
  nodes: Map<NodeId, GraphNode>;
  edges: {
    from: NodeId;
    to: NodeId;
    type: "call" | "conditional" | "dependency";
    condition?: string;
  }[];
}

class ToolCallDependencyGraphVisualizer {
  private graph: DependencyGraph;

  constructor() {
    this.graph = {
      nodes: new Map<NodeId, GraphNode>(),
      edges: [],
    };
  }

  private generateNodeId(message: Message, index: number): NodeId {
    const prefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${index}`;
  }

  private extractContent(message: Message): string {
    if (message.role === "user") {
      return message.content;
    }
    if (message.role === "assistant") {
      const blocks = message.content;
      return blocks.map(block => {
        if (block.type === "text") return block.text;
        if (block.type === "tool_use") return `Tool Call: ${block.name}(${JSON.stringify(block.input)})`;
        if (block.type === "thinking") return `Thinking: ${block.thinking}`;
        return "";
      }).join("\n---\n");
    }
    if (message.role === "tool") {
      return `Tool Result (${message.tool_use_id}): ${message.content}${message.is_error ? " [ERROR]" : ""}`;
    }
    return "";
  }

  public buildGraph(messages: Message[]): DependencyGraph {
    this.graph = {
      nodes: new Map<NodeId, GraphNode>(),
      edges: [],
    };

    let nodeIdCounter = 0;
    const nodeMap = new Map<Message, NodeId>();

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const nodeId = this.generateNodeId(message, i);
      nodeMap.set(message, nodeId);

      const node: GraphNode = {
        id: nodeId,
        type: message.role as "user" | "assistant" | "tool_result",
        content: this.extractContent(message),
      };
      this.graph.nodes.set(nodeId, node);
    }

    // Simplified edge construction for demonstration; real logic would analyze tool calls/dependencies
    for (let i = 0; i < messages.length - 1; i++) {
      const fromId = nodeMap.get(messages[i])!;
      const toId = nodeMap.get(messages[i + 1])!;
      let edgeType: "call" | "conditional" | "dependency" = "dependency";

      if (messages[i].role === "assistant" && messages[i+1].role === "tool") {
        edgeType = "call";
      } else if (messages[i].role === "user" && messages[i+1].role === "assistant") {
        edgeType = "call";
      }

      this.graph.edges.push({
        from: fromId,
        to: toId,
        type: edgeType,
        condition: "always",
      });
    }

    return this.graph;
  }

  private getMermaidSyntax(graph: DependencyGraph): string {
    let mermaid = "graph TD\n";
    const nodeIds = Array.from(graph.nodes.keys());

    // 1. Define Nodes
    nodeIds.forEach((id) => {
      const node = graph.nodes.get(id)!;
      let content = `(${id})["${node.content.replace(/"/g, '\\"')}"],`;
      if (node.type === "user") {
        content = `(${id}){{User Input}}["${node.content.replace(/"/g, '\\"')}"],`;
      } else if (node.type === "assistant") {
        content = `(${id}){{Assistant Response}}["${node.content.replace(/"/g, '\\"')}"],`;
      } else {
        content = `(${id}){{Tool Result}}["${node.content.replace(/"/g, '\\"')}"],`;
      }
      mermaid += `${content}\n`;
    });

    // 2. Define Edges (Handling mixed types and complex paths)
    graph.edges.forEach((edge, index) => {
      const { from, to, type, condition } = edge;
      let edgeSyntax = "";

      if (type === "conditional") {
        // Example: A -- "Condition" --> B
        edgeSyntax = `${from} -- "${condition || '?'}" --> ${to};`;
      } else if (type === "call") {
        // Example: A -->|Call| B
        edgeSyntax = `${from} -->|Call| ${to};`;
      } else {
        // Default dependency
        edgeSyntax = `${from} --> ${to};`;
      }

      mermaid += `${edgeSyntax}\n`;
    });

    return mermaid;
  }

  public visualizeMermaid(graph: DependencyGraph): string {
    return this.getMermaidSyntax(graph);
  }
}

export { ToolCallDependencyGraphVisualizer };