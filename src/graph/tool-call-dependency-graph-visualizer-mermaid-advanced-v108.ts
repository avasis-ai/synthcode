import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface DependencyGraphNode {
  id: string;
  type: "message" | "tool_call" | "tool_result";
  content: string;
  details?: Record<string, any>;
}

interface DependencyGraphEdge {
  fromId: string;
  toId: string;
  relationship: string;
}

export class ToolCallDependencyGraphVisualizer {
  private nodes: DependencyGraphNode[] = [];
  private edges: DependencyGraphEdge[] = [];

  constructor() {}

  private addNode(id: string, type: "message" | "tool_call" | "tool_result", content: string, details?: Record<string, any>): void {
    this.nodes.push({ id, type, content, details });
  }

  private addEdge(fromId: string, toId: string, relationship: string): void {
    this.edges.push({ fromId, toId: toId, relationship });
  }

  private processMessage(message: Message): void {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let contentSummary: string = "";

    if ("user" === (message as any).role) {
      this.addNode(messageId, "message", (message as any).content, { role: "user" });
      contentSummary = (message as any).content;
    } else if ("assistant" === (message as any).role) {
      this.addNode(messageId, "message", "Assistant Response", { role: "assistant" });
      contentSummary = this.serializeContentBlocks((message as any).content);
    } else if ("tool" === (message as any).role) {
      const toolResultMessage = message as any;
      const toolResultId = `tool_res_${toolResultMessage.tool_use_id}`;
      this.addNode(toolResultId, "tool_result", toolResultMessage.content, {
        tool_use_id: toolResultMessage.tool_use_id,
        is_error: toolResultMessage.is_error,
      });
      contentSummary = `Tool Result (${toolResultMessage.tool_use_id}): ${toolResultMessage.content.substring(0, 30)}...`;
    }
  }

  private serializeContentBlocks(blocks: ContentBlock[]): string {
    let text = "";
    for (const block of blocks) {
      if ("text" === (block as any).type) {
        text += (block as any).text;
      } else if ("tool_use" === (block as any).type) {
        const toolUse = block as any;
        text += `\n[Tool Call: ${toolUse.name}(${JSON.stringify(toolUse.input)})]`;
      } else if ("thinking" === (block as any).type) {
        text += `\n[Thinking: ${block as any}.thinking.substring(0, 30)}...]`;
      }
    }
    return text.trim();
  }

  public visualize(messages: Message[]): string {
    this.nodes = [];
    this.edges = [];

    let lastMessageId: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const messageId = `msg_${i}`;

      if (i > 0) {
        this.addEdge(lastMessageId!, messageId, "FOLLOWS");
      }

      this.processMessage(message);
      lastMessageId = messageId;
    }

    return this.generateMermaidGraph();
  }

  private generateMermaidGraph(): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes
    const nodeDefinitions: Record<string, string> = {};
    this.nodes.forEach(node => {
      let shape = "rectangle";
      let label = `ID: ${node.id}\\n${node.type.toUpperCase()}`;

      if (node.type === "message") {
        if (node.details?.role === "user") {
          shape = "user";
          label = `User Input`;
        } else if (node.details?.role === "assistant") {
          shape = "assistant";
          label = `Assistant Response`;
        }
      } else if (node.type === "tool_result") {
        shape = "tool_result";
        label = `Tool Result (${node.details?.tool_use_id || 'N/A'})`;
      }

      nodeDefinitions[node.id] = `${node.id}["${label}"]:::${node.type}`;
    });

    // 2. Define Styles (Classes)
    mermaid += "\n%% Styles\n";
    mermaid += "classDef user fill:#e6f7ff,stroke:#91d5ff,stroke-width:2px;\n";
    mermaid += "classDef assistant fill:#fff1e6,stroke:#ffc080,stroke-width:2px;\n";
    mermaid += "classDef tool_result fill:#f0f0f0,stroke:#ccc,stroke-width:2px,shape:hexagon;\n";
    mermaid += "classDef message fill:#f9f9f9,stroke:#333,stroke-width:1px;\n";

    // 3. Define Edges
    this.edges.forEach(edge => {
      let relationshipLabel = edge.relationship;
      if (edge.relationship === "FOLLOWS") {
        relationshipLabel = "->";
      } else if (edge.relationship === "TOOL_CALL_DEPENDS") {
        relationshipLabel = "-->|Calls|";
      }
      mermaid += `${edge.fromId} ${relationshipLabel} ${edge.toId};\n`;
    });

    // 4. Apply Classes
    this.nodes.forEach(node => {
      mermaid += `${node.id}:::${node.type};\n`;
    });

    return mermaid;
  }
}

export const createGraphVisualizer = (): ToolCallDependencyGraphVisualizer => {
  return new ToolCallDependencyGraphVisualizer();
};