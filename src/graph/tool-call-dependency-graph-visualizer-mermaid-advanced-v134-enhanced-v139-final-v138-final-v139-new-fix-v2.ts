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

interface GraphContext {
  messages: Message[];
  toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
  toolResults: {
    tool_use_id: string;
    content: string;
    is_error?: boolean;
  }[];
}

interface NodeConfig {
  id: string;
  label: string;
  type: "user" | "assistant" | "tool";
  metadata?: Record<string, any>;
}

interface EdgeConfig {
  fromId: string;
  toId: string;
  label: string;
  style?: "success" | "error" | "default";
}

export class ToolCallDependencyGraphVisualizerMermaid {
  private context: GraphContext;
  private nodes: NodeConfig[] = [];
  private edges: EdgeConfig[] = [];

  constructor(context: GraphContext) {
    this.context = context;
  }

  private _extractNodesAndEdges(): { nodes: NodeConfig[]; edges: EdgeConfig[] } {
    const nodes: NodeConfig[] = [];
    const edges: EdgeConfig[] = [];

    // 1. Process User Messages (Start Node)
    if (this.context.messages.length > 0 && this.context.messages[0] instanceof UserMessage) {
      const userMsg = this.context.messages[0] as UserMessage;
      nodes.push({
        id: "user_input",
        label: `User: ${userMsg.content.substring(0, 30)}...`,
        type: "user",
        metadata: { content: userMsg.content },
      });
    }

    // 2. Process Assistant Messages (Tool Calls/Thinking)
    let lastAssistantId: string | null = null;
    for (const msg of this.context.messages) {
      if (msg instanceof AssistantMessage) {
        const assistantMsg = msg as AssistantMessage;
        let currentBlockId: string = `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        if (assistantMsg.content.some(block => block.type === "tool_use")) {
          const toolUseBlock = (assistantMsg.content.find(block => block.type === "tool_use") as ToolUseBlock);
          if (toolUseBlock) {
            nodes.push({
              id: `tool_call_${toolUseBlock.id}`,
              label: `Call: ${toolUseBlock.name}`,
              type: "assistant",
              metadata: { tool_use_id: toolUseBlock.id },
            });
            if (lastAssistantId) {
              edges.push({
                fromId: lastAssistantId,
                toId: `tool_call_${toolUseBlock.id}`,
                label: "Calls",
                style: "default",
              });
            }
            lastAssistantId = `tool_call_${toolUseBlock.id}`;
            continue;
          }
        }

        if (assistantMsg.content.some(block => block.type === "thinking")) {
          const thinkingBlock = (assistantMsg.content.find(block => block.type === "thinking") as ThinkingBlock);
          nodes.push({
            id: `thinking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            label: `Thinking...`,
            type: "assistant",
            metadata: { thinking: thinkingBlock.thinking },
          });
          if (lastAssistantId) {
            edges.push({
              fromId: lastAssistantId,
              toId: `thinking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              label: "Thought",
              style: "default",
            });
            lastAssistantId = `thinking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          }
        }
        // Simplified handling for text content if no tool use/thinking is present
        if (assistantMsg.content.some(block => block.type === "text")) {
            nodes.push({
                id: `assistant_text_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                label: `Response: ${assistantMsg.content.find(b => b.type === "text")?.text.substring(0, 30)}...`,
                type: "assistant",
                metadata: { content: assistantMsg.content.find(b => b.type === "text")?.text },
            });
            if (lastAssistantId) {
                edges.push({
                    fromId: lastAssistantId,
                    toId: `assistant_text_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    label: "Responds",
                    style: "default",
                });
                lastAssistantId = `assistant_text_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            }
        }
      }
    }

    // 3. Process Tool Results (Tool Output Nodes)
    for (const result of this.context.toolResults) {
      const isError = result.is_error === true;
      const nodeId = `tool_result_${result.tool_use_id}`;
      nodes.push({
        id: nodeId,
        label: `Tool Output (${result.tool_use_id.substring(0, 4)}): ${isError ? "ERROR" : "Success"}`,
        type: "tool",
        metadata: { is_error: isError, content: result.content },
      });

      // Link from the last tool call that matches this result ID
      const callingToolNode = nodes.find(n => n.metadata?.tool_use_id === result.tool_use_id);
      if (callingToolNode && lastAssistantId) {
        edges.push({
          fromId: lastAssistantId,
          toId: nodeId,
          label: isError ? "Error Received" : "Result",
          style: isError ? "error" : "success",
        });
        lastAssistantId = nodeId;
      }
    }

    return { nodes, edges };
  }

  private _generateMermaidGraph(nodes: NodeConfig[], edges: EdgeConfig[]): string {
    let mermaid = "graph TD\n";

    // Define Node Styles (Advanced Customization)
    mermaid += "classDef user fill:#e6f7ff,stroke:#91d5ff,stroke-width:2px; ";
    mermaid += "classDef assistant fill:#fffbe6,stroke:#ffe58f,stroke-width:2px; ";
    mermaid += "classDef tool fill:#f6ffed,stroke:#b7eb8f,stroke-width:2px; ";
    mermaid += "classDef error fill:#fff1f0,stroke:#ffccc7,stroke-width:2px; ";

    // Define Nodes
    const nodeMap = new Map<string, NodeConfig>();
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
      let shape = "rounded";
      let classDef = "";

      if (node.type === "user") {
        classDef = "classDef user";
        shape = "rect";
      } else if (node.type === "assistant") {
        classDef = "classDef assistant";
        shape = "rect";
      } else if (node.type === "tool") {
        classDef = "classDef tool";
        shape = "stadium";
      }

      mermaid += `${node.id}["${node.label}"]:::${node.type};\n`;
    });

    // Define Edges
    edges.forEach(edge => {
      let style = "-->";
      if (edge.style === "error") {
        style = "-->"; // Mermaid handles style via class, but we can use specific link styles if needed
      }
      mermaid += `${edge.fromId} -- "${edge.label}" --> ${edge.toId};\n`;
    });

    // Apply classes for styling consistency
    nodes.forEach(node => {
        mermaid += `class ${node.id} ${node.type};\n`;
    });

    return mermaid;
  }

  /**
   * Generates the complete Mermaid graph definition string.
   * @returns {string} The Mermaid syntax string.
   */
  public generateGraphMermaid(): string {
    const { nodes, edges } = this._extractNodesAndEdges();
    return this._generateMermaidGraph(nodes, edges);
  }
}