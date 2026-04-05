import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface AdvancedGraphOptions {
  direction?: "TD" | "LR";
  subgraphTitle?: string;
  nodeStyle?: {
    default: string;
    toolUse: string;
    thinking: string;
    message: string;
  };
  linkStyle?: {
    default: string;
    dependency: string;
  };
  groupBy?: "role" | "tool";
}

export type GraphContext = {
  messages: Message[];
  options: AdvancedGraphOptions;
};

export class ToolCallDependencyGraphVisualizer {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeId(message: Message, index: number): string {
    const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    const contentHash = message.content ? message.content.substring(0, 5) : "N";
    return `${rolePrefix}-${Math.floor(index / 2)}-${contentHash}`;
  }

  private renderNode(message: Message, index: number): string {
    const nodeId = this.generateNodeId(message, index);
    const options = this.context.options;
    let content = "";
    let nodeClass = "default";

    if (message.role === "user") {
      content = `User Input: ${message.content.substring(0, 50)}...`;
      nodeClass = "message";
    } else if (message.role === "assistant") {
      const blocks = message.content;
      let toolUses: ToolUseBlock[] = [];
      let textContent = "";

      for (const block of blocks) {
        if (block.type === "tool_use") {
          toolUses.push(block as ToolUseBlock);
        } else if (block.type === "text") {
          textContent += (block as TextBlock).text + " ";
        }
      }

      if (toolUses.length > 0) {
        content = `Assistant (Tools): ${toolUses.map(t => t.name).join(", ")}...`;
        nodeClass = "toolUse";
      } else {
        content = `Assistant Response: ${textContent.substring(0, 50)}...`;
        nodeClass = "message";
      }
    } else if (message.role === "tool") {
      const toolResult = message as ToolResultMessage;
      const errorStatus = toolResult.is_error ? "ERROR" : "SUCCESS";
      content = `Tool Result (${toolResult.tool_use_id}): ${errorStatus} - ${toolResult.content.substring(0, 30)}...`;
      nodeClass = "toolUse";
    }

    const style = options.nodeStyle || {};
    const nodeStyleDef = style.default;
    const specificStyle = style[nodeClass] || nodeStyleDef;

    return `node${nodeId}["${content}"]:::${nodeClass}Style`;
  }

  private renderGraphDefinition(): string {
    const { messages, options } = this.context;
    let mermaidCode = `graph ${options.direction || "TD"} {`;
    const nodeIds: string[] = [];
    const nodeDefinitions: string[] = [];

    messages.forEach((message, index) => {
      const nodeId = this.generateNodeId(message, index);
      nodeDefinitions.push(this.renderNode(message, index));
      nodeIds.push(nodeId);
    });

    mermaidCode += nodeDefinitions.join("\n    ");

    // Add links (simplified dependency: sequential)
    for (let i = 0; i < messages.length - 1; i++) {
      const sourceId = this.generateNodeId(messages[i], i);
      const targetId = this.generateNodeId(messages[i + 1], i + 1);
      mermaidCode += `\n    ${sourceId} -->|Dependency| ${targetId};`;
    }

    mermaidCode += "\n}";

    return mermaidCode;
  }

  private renderStyles(): string {
    const options = this.context.options;
    const style = options.nodeStyle || {};
    const linkStyle = options.linkStyle || {};

    let styleCode = "classDef defaultStyle fill:#eee,stroke:#333,stroke-width:2px;\n";
    styleCode += `classDef messageStyle fill:#bbf,stroke:#333,stroke-width:2px;\n`;
    styleCode += `classDef toolUseStyle fill:#ffc,stroke:#333,stroke-width:2px;\n`;
    styleCode += `classDef thinkingStyle fill:#ddd,stroke:#333,stroke-width:2px;\n`;

    if (style.default) styleCode += `classDef defaultStyle fill:${style.default},stroke:#333,stroke-width:2px;\n`;
    if (style.toolUse) styleCode += `classDef toolUseStyle fill:${style.toolUse},stroke:#333,stroke-width:2px;\n`;
    if (style.thinking) styleCode += `classDef thinkingStyle fill:${style.thinking},stroke:#333,stroke-width:2px;\n`;
    if (style.message) styleCode += `classDef messageStyle fill:${style.message},stroke:#333,stroke-width:2px;\n`;

    styleCode += `linkStyle defaultLink stroke:#666,stroke-width:1.5px;\n`;
    if (linkStyle.dependency) styleCode += `linkStyle dependencyLink stroke:red,stroke-width:2px;\n`;

    return styleCode;
  }

  public generateMermaidString(): string {
    const graphDefinition = this.renderGraphDefinition();
    const styles = this.renderStyles();

    return `${graphDefinition}\n\n${styles}`;
  }
}