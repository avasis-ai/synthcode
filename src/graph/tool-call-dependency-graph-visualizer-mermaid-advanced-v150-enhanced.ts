import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface GraphNode {
  id: string;
  type: "message" | "flow_control";
  content: any;
}

export interface FlowControlNode extends GraphNode {
  type: "flow_control";
  condition?: string;
  nextNodes?: Record<string, string>; // Maps condition outcome/label to next node ID
}

export class ToolCallDependencyGraphVisualizer {
  private nodes: GraphNode[] = [];
  private edges: { from: string; to: string; label: string }[] = [];

  constructor(nodes: GraphNode[]) {
    this.nodes = nodes;
  }

  private addEdge(fromId: string, toId: string, label: string = "") {
    this.edges.push({ from: fromId, to: toId, label });
  }

  private processMessageNode(node: GraphNode): void {
    if (node.type !== "message") return;

    const message = node as { message: Message };
    const id = node.id;

    if (message.message.role === "user") {
      // User input node
      // No outgoing edges needed from the initial user message in this simplified view
    } else if (message.message.role === "assistant") {
      // Assistant message node (can lead to tool calls or text)
      const content = message.message.content;
      if (content.some((block) => block.type === "tool_use")) {
        // Logic to connect to tool call nodes if they were explicitly added
      }
    }
  }

  private processFlowControlNode(node: FlowControlNode): void {
    const id = node.id;
    if (!node.condition) return;

    // 1. Define the main node structure (e.g., Decision Point)
    // 2. Process outgoing edges based on nextNodes map
    for (const [outcome, nextNodeId] of Object.entries(node.nextNodes || {})) {
      let label = outcome;
      if (outcome.toLowerCase().includes("if")) {
        label = outcome;
      } else if (outcome.toLowerCase().includes("else")) {
        label = "else";
      }
      this.addEdge(id, nextNodeId, label);
    }
  }

  public visualize(): string {
    let mermaidGraph = "graph TD;\n";
    let nodeDefinitions: string[] = [];
    let edgeDefinitions: string[] = [];

    for (const node of this.nodes) {
      if (node.type === "message") {
        const messageNode = node as { message: Message };
        const id = node.id;
        nodeDefinitions.push(`${id}["${this.formatMessageContent(messageNode.message)}"]`);
      } else if (node.type === "flow_control") {
        const flowNode = node as FlowControlNode;
        const id = node.id;
        nodeDefinitions.push(`${id}["Decision: ${flowNode.condition || 'Unknown'}"]`);
      }
    }

    // Process Edges
    for (const edge of this.edges) {
      let label = edge.label;
      let formattedEdge = `${edge.from} -- ${label} --> ${edge.to};`;
      edgeDefinitions.push(formattedEdge);
    }

    // Combine into final Mermaid syntax
    mermaidGraph += nodeDefinitions.join('\n') + "\n";
    mermaidGraph += edgeDefinitions.join('\n');

    return mermaidGraph;
  }

  private formatMessageContent(message: Message): string {
    if (message.role === "user") {
      return `User: ${message.content}`;
    } else if (message.role === "assistant") {
      const contentBlocks = message.content;
      let textContent = "";
      for (const block of contentBlocks) {
        if (block.type === "text") {
          textContent += block.text + "\n";
        }
      }
      return `Assistant:\n${textContent.trim()}`;
    } else if (message.role === "tool") {
      return `Tool Result (${message.tool_use_id}): ${message.content}`;
    }
    return "Unknown Message";
  }
}