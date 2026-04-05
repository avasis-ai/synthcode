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
  toolCalls: Record<string, { name: string; input: Record<string, unknown> }>;
  dependencies: Record<string, string[]>;
}

type GraphStateChange = "NODE_ADDED" | "NODE_UPDATED" | "EDGE_ADDED" | "GRAPH_RESET";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV18 {
  private context: GraphContext;
  private mermaidGraph: string = "";

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeId(message: Message, index: number): string {
    if (message.role === "user") {
      return `user_${message.content.substring(0, 5).replace(/[^a-zA-Z0-9]/g, '')}_${index}`;
    }
    if (message.role === "assistant") {
      return `assistant_${index}`;
    }
    if (message.role === "tool") {
      return `tool_${message.tool_use_id}`;
    }
    return `node_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateNodeStyle(nodeId: string, type: "user" | "assistant" | "tool"): string {
    switch (type) {
      case "user":
        return "style " + nodeId + " fill:#e0f7fa,stroke:#00bcd4,stroke-width:2px";
      case "assistant":
        return "style " + nodeId + " fill:#fff9c4,stroke:#ffeb3b,stroke-width:2px";
      case "tool":
        return "style " + nodeId + " fill:#fce4ec,stroke:#e91e63,stroke-width:2px";
      default:
        return "";
    }
  }

  private generateEdgeStyle(sourceId: string, targetId: string): string {
    return "linkStyle 1 stroke:#4caf50,stroke-width:2px";
  }

  private processGraphStateChange(changeType: GraphStateChange): string {
    let mermaid = "graph TD\n";
    let nodeDeclarations: string[] = [];
    let edgeDeclarations: string[] = [];

    // 1. Process Messages for Nodes
    this.context.messages.forEach((message, index) => {
      const nodeId = this.generateNodeId(message, index);
      let nodeContent = "";
      let nodeType: "user" | "assistant" | "tool" = "unknown";

      if (message.role === "user") {
        nodeType = "user";
        nodeContent = `User Input: ${message.content.substring(0, 50)}...`;
        nodeDeclarations.push(`${nodeId}["${nodeContent}"]`);
      } else if (message.role === "assistant") {
        nodeType = "assistant";
        const contentSummary = message.content.map(block => {
          if (block.type === "text") return `Text: ${block.text.substring(0, 30)}...`;
          if (block.type === "tool_use") return `Tool Call: ${block.name}`;
          return "";
        }).join(" | ");
        nodeContent = `Assistant Response: ${contentSummary}`;
        nodeDeclarations.push(`${nodeId}["${nodeContent}"]`);
      } else if (message.role === "tool") {
        nodeType = "tool";
        nodeContent = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
        nodeDeclarations.push(`${nodeId}["${nodeContent}"]`);
      }
    });

    // 2. Process Tool Calls for Nodes (if not covered by message flow)
    Object.keys(this.context.toolCalls).forEach((toolId) => {
      const toolCall = this.context.toolCalls[toolId];
      const nodeId = `tool_call_${toolId}`;
      nodeDeclarations.push(`${nodeId}["Tool: ${toolCall.name} (Input: ${JSON.stringify(toolCall.input)})"]`);
    });

    // 3. Process Dependencies for Edges
    Object.entries(this.context.dependencies).forEach(([sourceId, targetIds]) => {
      targetIds.forEach(targetId => {
        edgeDeclarations.push(`${sourceId} -->|Depends On| ${targetId}`);
      });
    });

    // 4. Assemble Mermaid Syntax
    let styleDeclarations = nodeDeclarations.map(decl => `${decl} ${this.generateNodeStyle(decl.match(/"([^"]+)"/)?.[1] || 'unknown', 'unknown')}`).join("\n");
    let linkStyleDeclarations = edgeDeclarations.map((edge, index) => `${edge} ${this.generateEdgeStyle(edge.split("-->|")[0].trim(), edge.split("-->|")[1].trim())}`).join("\n");

    mermaid = `%%{init: {'theme': 'base', 'flowchart': {'rankSpacing': 50, 'nodesize': 300}}}%%
${nodeDeclarations.join('\n')}
${edgeDeclarations.join('\n')}
${styleDeclarations}
${linkStyleDeclarations}`;

    return mermaid;
  }

  public visualize(changeType: GraphStateChange): string {
    this.mermaidGraph = this.processGraphStateChange(changeType);
    return this.mermaidGraph;
  }
}