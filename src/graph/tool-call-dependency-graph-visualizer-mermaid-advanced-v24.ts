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

interface AdvancedGraphNode {
  message: Message;
  id: string;
  layoutHints?: {
    group?: string;
    subgraph?: string;
    direction?: "LR" | "TB";
  };
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV24 {
  private nodes: AdvancedGraphNode[];
  private edges: { fromId: string; toId: string; relationship: string }[];

  constructor(nodes: AdvancedGraphNode[], edges: { fromId: string; toId: string; relationship: string }[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private generateNodeDefinition(node: AdvancedGraphNode): string {
    const { message, id, layoutHints } = node;
    let content = "";

    if (message.role === "user") {
      content = `User Input: "${message.content.substring(0, 50)}..."`;
    } else if (message.role === "assistant") {
      const blocks = (message as AssistantMessage).content;
      let blockContent = "";
      for (const block of blocks) {
        if (block.type === "text") {
          blockContent += `\nText: "${(block as TextBlock).text.substring(0, 50)}..."`;
        } else if (block.type === "tool_use") {
          const toolUse = block as ToolUseBlock;
          blockContent += `\nTool Call: ${toolUse.name}(${JSON.stringify(toolUse.input)})`;
        } else if (block.type === "thinking") {
          const thinking = block as ThinkingBlock;
          blockContent += `\nThinking: "${thinking.thinking.substring(0, 50)}..."`;
        }
      }
      content = `Assistant Response:\n${blockContent}`;
    } else if (message.role === "tool") {
      const toolResult = message as ToolResultMessage;
      const errorIndicator = toolResult.is_error ? " [ERROR]" : "";
      content = `Tool Result (${toolResult.tool_use_id}): ${toolResult.content}${errorIndicator}`;
    }

    let definition = `node_${id}["${id}\\n${content}"]`;

    if (layoutHints?.group) {
      definition = `subgraph ${layoutHints.group} ${definition}`;
    } else if (layoutHints?.subgraph) {
      definition = `subgraph ${layoutHints.subgraph} ${definition}`;
    }

    return definition;
  }

  private generateEdgeDefinition(): string {
    return this.edges.map(edge => {
      return `${edge.fromId} -- "${edge.relationship}" --> ${edge.toId}`;
    }).join('\n');
  }

  public renderMermaidGraph(): string {
    const nodeDefinitions = this.nodes.map(this.generateNodeDefinition).join('\n');
    const edgeDefinitions = this.generateEdgeDefinition();

    let mermaidCode = `graph TD\n`;
    mermaidCode += `%% Advanced Tool Call Dependency Graph\n`;
    mermaidCode += `${nodeDefinitions}\n`;
    mermaidCode += `${edgeDefinitions}\n`;
    return mermaidCode;
  }

  public renderMermaidGraphWithLayoutHints(): string {
    let mermaidCode = `graph TD\n`;
    mermaidCode += `%% Advanced Tool Call Dependency Graph with Layout Hints\n`;

    const nodeDefinitions = this.nodes.map(node => {
      let definition = `node_${node.id}["${node.id}\\n${this.generateNodeContent(node.message)}"]`;
      if (node.layoutHints?.group) {
        return `subgraph ${node.layoutHints.group} ${definition}`;
      }
      return definition;
    }).join('\n');

    const edgeDefinitions = this.edges.map(edge => {
      return `${edge.fromId} -- "${edge.relationship}" --> ${edge.toId}`;
    }).join('\n');

    mermaidCode += `${nodeDefinitions}\n`;
    mermaidCode += `${edgeDefinitions}\n`;
    return mermaidCode;
  }

  private generateNodeContent(message: Message): string {
    if (message.role === "user") {
      return `User Input: "${(message as UserMessage).content.substring(0, 50)}..."`;
    } else if (message.role === "assistant") {
      const blocks = (message as AssistantMessage).content;
      let blockContent = "";
      for (const block of blocks) {
        if (block.type === "text") {
          blockContent += `\nText: "${(block as TextBlock).text.substring(0, 50)}..."`;
        } else if (block.type === "tool_use") {
          const toolUse = block as ToolUseBlock;
          blockContent += `\nTool Call: ${toolUse.name}(${JSON.stringify(toolUse.input)})`;
        } else if (block.type === "thinking") {
          const thinking = block as ThinkingBlock;
          blockContent += `\nThinking: "${thinking.thinking.substring(0, 50)}..."`;
        }
      }
      return `Assistant Response:\n${blockContent}`;
    } else if (message.role === "tool") {
      const toolResult = message as ToolResultMessage;
      const errorIndicator = toolResult.is_error ? " [ERROR]" : "";
      return `Tool Result (${toolResult.tool_use_id}): ${toolResult.content}${errorIndicator}`;
    }
    return "Unknown Content";
  }
}