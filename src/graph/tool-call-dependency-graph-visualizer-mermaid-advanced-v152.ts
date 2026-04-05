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

export interface AdvancedLayoutOptions {
  layoutType: "force-directed" | "layered" | "circular";
  direction: "TD" | "TB";
  nodeGrouping: Record<string, string>;
  linkWeighting: (source: Message, target: Message) => number;
}

export interface GraphContext {
  messages: Message[];
  layoutOptions: AdvancedLayoutOptions;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV152 {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeId(message: Message, index: number): string {
    const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    const contentHash = message.content ? JSON.stringify(message.content) : "empty";
    return `${rolePrefix}_${Math.random().toString(36).substring(2)}${index}`;
  }

  private generateNodeDefinition(message: Message, nodeId: string): string {
    let contentString = "";
    if (message.role === "user") {
      contentString = `User Input: "${message.content.text.substring(0, 30)}..."`;
    } else if (message.role === "assistant") {
      const toolUses = (message.content as AssistantMessage & { content: ContentBlock[] }).content.filter(
        (block): block is ToolUseBlock => block.type === "tool_use"
      );
      if (toolUses.length > 0) {
        contentString = `Assistant Action (Tool Calls): ${toolUses.map(t => t.name).join(", ")}`;
      } else {
        contentString = `Assistant Response: "${message.content.filter((block): block is TextBlock => block.type === "text")?.[0]?.text.substring(0, 30) || 'No text'}..."`;
      }
    } else if (message.role === "tool") {
      contentString = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
    }

    return `    ${nodeId}["${contentString}"]`;
  }

  private generateLinkDefinition(source: Message, target: Message, sourceId: string, targetId: string): string {
    const weight = this.context.layoutOptions.linkWeighting(source, target);
    let linkSyntax = `    ${sourceId} -->|Weight: ${weight.toFixed(1)}| ${targetId}`;

    if (source.role === "assistant" && target.role === "tool") {
      const toolUseBlock = (source.content as AssistantMessage & { content: ContentBlock[] }).content.find(
        (block): block is ToolUseBlock => block.type === "tool_use"
      );
      if (toolUseBlock) {
        linkSyntax = `    ${sourceId} -- "${toolUseBlock.name}" --> ${targetId}`;
      }
    }
    return linkSyntax;
  }

  public renderMermaidGraph(): string {
    const { messages, layoutOptions } = this.context;
    if (!messages || messages.length === 0) {
      return "graph TD; A[No messages to visualize]";
    }

    let nodeDefinitions: string[] = [];
    let linkDefinitions: string[] = [];
    const nodeIds: Record<Message, string> = new Map();

    // 1. Generate Nodes
    messages.forEach((message, index) => {
      const nodeId = this.generateNodeId(message, index);
      nodeIds.set(message, nodeId);
      nodeDefinitions.push(this.generateNodeDefinition(message, nodeId));
    });

    // 2. Generate Links (Sequential dependency)
    for (let i = 0; i < messages.length - 1; i++) {
      const source = messages[i];
      const target = messages[i + 1];
      const sourceId = nodeIds.get(source)!;
      const targetId = nodeIds.get(target)!;
      linkDefinitions.push(this.generateLinkDefinition(source, target, sourceId, targetId));
    }

    // 3. Assemble Graph
    const graphTitle = `Tool Call Dependency Graph (Layout: ${layoutOptions.layoutType}, Direction: ${layoutOptions.direction})`;
    let mermaidGraph = `graph ${layoutOptions.direction} ${graphTitle} {\n`;

    // Add advanced layout directives (if applicable)
    if (layoutOptions.layoutType === "layered") {
      mermaidGraph += `    %% Advanced Layering Directives for ${layoutOptions.layoutType} layout\n`;
    }

    mermaidGraph += nodeDefinitions.join('\n') + '\n';
    mermaidGraph += linkDefinitions.join('\n');
    mermaidGraph += '\n}';

    return mermaidGraph;
  }
}