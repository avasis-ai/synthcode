import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

interface GraphVisualizerOptions {
  mermaidConfig?: Record<string, any>;
  customStyles?: Record<string, string>;
  includeToolCallDetails?: boolean;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV20 {
  private options: GraphVisualizerOptions;

  constructor(options: GraphVisualizerOptions = {}) {
    this.options = {
      mermaidConfig: {},
      customStyles: {},
      includeToolCallDetails: true,
      ...options,
    };
  }

  private buildNodeId(message: Message, index: number): string {
    const role = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    const contentSnippet = message.content?.length ? String(message.content).substring(0, 10).replace(/[^a-zA-Z0-9]/g, '') : "N";
    return `${role}-${message.tool_use_id || ''}-${index}`;
  }

  private generateNodeMermaid(message: Message, index: number, nodeId: string): string {
    let content = "";
    if (message.role === "user") {
      content = `User Input: "${message.content?.substring(0, 50) || 'N/A'}"`;
    } else if (message.role === "assistant") {
      const toolUses = (message.content as ContentBlock[]).filter(block => block.type === "tool_use");
      if (toolUses.length > 0) {
        content = `Assistant Response (Tools): ${toolUses.map(t => t.name).join(", ")}`;
      } else {
        content = `Assistant Text: "${(message.content as ContentBlock[])[0]?.text || 'N/A'}"`;
      }
    } else if (message.role === "tool") {
      content = `Tool Result (${message.tool_use_id}): ${message.content}`;
    }

    let style = `style ${nodeId} fill:#f9f,stroke:#333,stroke-width:2px`;
    if (this.options.customStyles?.[nodeId]) {
      style = `style ${nodeId} ${this.options.customStyles[nodeId]}`;
    }

    return `    ${nodeId}[\"${content}\"]\n    ${style}\n`;
  }

  private generateEdgeMermaid(fromId: string, toId: string, label: string): string {
    const labelFormatted = label.replace(/"/g, '\\"');
    return `    ${fromId} -->|${labelFormatted}| ${toId}\n`;
  }

  public visualize(messages: Message[], title: string = "Tool Call Dependency Graph"): string {
    let mermaidNodes = "";
    let mermaidEdges = "";

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const nodeId = this.buildNodeId(message, i);
      mermaidNodes += this.generateNodeMermaid(message, i, nodeId);
    }

    // Simplified edge generation: assume sequential flow for basic graph
    for (let i = 0; i < messages.length - 1; i++) {
      const fromId = this.buildNodeId(messages[i], i);
      const toId = this.buildNodeId(messages[i + 1], i + 1);
      let label = "Continues";

      if (messages[i].role === "user" && messages[i+1].role === "assistant") {
        label = "Initial Call";
      } else if (messages[i].role === "assistant" && messages[i+1].role === "tool") {
        label = "Tool Execution";
      } else if (messages[i].role === "tool" && messages[i+1].role === "assistant") {
        label = "Tool Result Processed";
      }

      mermaidEdges += this.generateEdgeMermaid(fromId, toId, label);
    }

    let mermaidCode = `graph TD\n`;
    mermaidCode += `%% Graph Title: ${title} %% \n`;
    mermaidCode += `%% Advanced Styling & Directives: ${JSON.stringify(this.options.mermaidConfig)} %% \n`;
    mermaidCode += mermaidNodes;
    mermaidCode += mermaidEdges;

    return mermaidCode;
  }
}