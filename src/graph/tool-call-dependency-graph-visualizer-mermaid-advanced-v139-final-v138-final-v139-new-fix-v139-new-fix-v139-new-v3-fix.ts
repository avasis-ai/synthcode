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
  graphTitle: string;
  mermaidGraphType: "graph TD" | "graph LR";
  metadataHooks: {
    onStart?: (context: GraphContext) => string;
    onEnd?: (context: GraphContext) => string;
    onNodeProcess?: (nodeId: string, context: GraphContext) => string;
    onEdgeProcess?: (fromId: string, toId: string, context: GraphContext) => string;
  };
}

export class ToolCallDependencyGraphVisualizer {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private buildNodeId(message: Message, index: number): string {
    const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    const contentSnippet = message.content.length > 10 ? message.content.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') : "C";
    return `${rolePrefix}_${Math.floor(index / 2)}_N${Math.floor(index % 2 === 0 ? 1 : 2)}`;
  }

  private buildNodeDefinition(message: Message, nodeId: string): string {
    let contentSummary = "";
    if (message.role === "user") {
      contentSummary = `User Input: "${message.content.substring(0, 30)}..."`;
    } else if (message.role === "assistant") {
      const toolUses = (message as AssistantMessage).content.filter((block): block is ToolUseBlock => block.type === "tool_use");
      if (toolUses.length > 0) {
        contentSummary = `Called Tools: ${toolUses.map(t => t.name).join(", ")}`;
      } else {
        contentSummary = `Response: "${(message as AssistantMessage).content.map((block): TextBlock => block as TextBlock).reduce((acc, block) => acc + block.text, "")).substring(0, 30)}..."`;
      }
    } else if (message.role === "tool") {
      contentSummary = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
    }

    return `    ${nodeId}["${contentSummary}"]`;
  }

  private buildEdgeDefinition(fromId: string, toId: string, context: GraphContext): string {
    const edgeLabel = context.metadataHooks.onEdgeProcess?.(fromId, toId, context) || "";
    return `    ${fromId} -->|${edgeLabel ? edgeLabel : "Follows"}| ${toId}`;
  }

  public generateGraphString(): string {
    const { messages, graphTitle, mermaidGraphType, metadataHooks } = this.context;

    let mermaidCode = `graph ${mermaidGraphType} {\n`;

    if (metadataHooks.onStart) {
      mermaidCode += `    subgraph Start\n${metadataHooks.onStart(this.context)}\n    end\n`;
    }

    const nodeIds: string[] = [];
    const nodeDefinitions: string[] = [];
    const edgeDefinitions: string[] = [];

    // 1. Process Nodes and establish IDs
    messages.forEach((message, index) => {
      const nodeId = this.buildNodeId(message, index);
      nodeIds.push(nodeId);
      nodeDefinitions.push(this.buildNodeDefinition(message, nodeId));
    });

    // 2. Process Edges (Sequential flow)
    for (let i = 0; i < messages.length - 1; i++) {
      const fromId = nodeIds[i];
      const toId = nodeIds[i + 1];
      edgeDefinitions.push(this.buildEdgeDefinition(fromId, toId, this.context));
    }

    // 3. Assemble Graph
    mermaidCode += `    %% Nodes\n${nodeDefinitions.join('\n')}\n\n`;
    mermaidCode += `    %% Edges\n${edgeDefinitions.join('\n')}\n`;

    if (metadataHooks.onEnd) {
      mermaidCode += `    subgraph End\n${metadataHooks.onEnd(this.context)}\n    end\n`;
    }

    mermaidCode += `}`;

    return mermaidCode;
  }
}