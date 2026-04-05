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

interface DependencyGraphConfig {
  messages: Message[];
  graphTitle: string;
}

type NodeId = string;

class ToolCallDependencyGraphVisualizerMermaidAdvancedV101 {
  private config: DependencyGraphConfig;

  constructor(config: DependencyGraphConfig) {
    this.config = config;
  }

  private parseAdvancedDirective(content: string): {
    style: string | null;
    group: string | null;
  } {
    const directives: {
      key: string;
      value: string;
    }[] = [];
    const parts = content.split(/\s+/);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.toLowerCase().startsWith("group:")) {
        const groupValue = part.substring("group:".length).trim();
        directives.push({ key: "group", value: groupValue });
      } else if (part.toLowerCase().startsWith("style:")) {
        const styleValue = part.substring("style:".length).trim();
        directives.push({ key: "style", value: styleValue });
      }
    }

    let style: string | null = null;
    let group: string | null = null;

    for (const directive of directives) {
      if (directive.key === "style") {
        style = directive.value;
      } else if (directive.key === "group") {
        group = directive.value;
      }
    }

    return { style, group };
  }

  private generateNodeDefinition(
    nodeId: NodeId,
    message: Message,
    content: string,
    advancedDirectives: {
    style: string | null;
    group: string | null;
  }
  ): string {
    let contentBody = "";
    if (message.role === "user") {
      contentBody = `User Input: ${content}`;
    } else if (message.role === "assistant") {
      contentBody = this.generateAssistantContent(message.content);
    } else if (message.role === "tool") {
      contentBody = `Tool Result (${message.tool_use_id}): ${content}`;
    }

    let definition = `node${nodeId}["${contentBody}"]`;

    if (advancedDirectives.style) {
      definition += ` style ${advancedDirectives.style}`;
    }
    if (advancedDirectives.group) {
      definition += ` group ${advancedDirectives.group}`;
    }

    return definition;
  }

  private generateAssistantContent(contentBlocks: ContentBlock[]): string {
    const parts: string[] = [];
    for (const block of contentBlocks) {
      if (block.type === "text") {
        parts.push(`Text: ${block.text}`);
      } else if (block.type === "tool_use") {
        parts.push(`Tool Call: ${block.name}(${JSON.stringify(block.input)})`);
      } else if (block.type === "thinking") {
        parts.push(`Thinking: ${block.thinking}`);
      }
    }
    return parts.join("\n---\n");
  }

  private generateEdgeDefinition(
    sourceId: NodeId,
    targetId: NodeId,
    message: Message,
    advancedDirectives: {
    style: string | null;
    group: string | null;
  }
  ): string {
    let edge = `${sourceId} --> ${targetId}`;

    if (advancedDirectives.style) {
      edge += ` style ${advancedDirectives.style}`;
    }
    if (advancedDirectives.group) {
      edge += ` group ${advancedDirectives.group}`;
    }

    return edge;
  }

  public renderMermaidGraph(): string {
    const { messages, graphTitle } = this.config;
    const nodeDefinitions: string[] = [];
    const edgeDefinitions: string[] = [];
    const subgraphDefinitions: string[] = [];

    const nodeMap: Map<NodeId, {
      message: Message;
      content: string;
      directives: {
        style: string | null;
        group: string | null;
      };
    }[]> = new Map();

    // 1. Process Nodes and Directives
    messages.forEach((message, index) => {
      let content: string = "";
      let advancedDirectives: {
        style: string | null;
        group: string | null;
      } = { style: null, group: null };

      // Simulate parsing directives from content for demonstration purposes
      // In a real scenario, directives might be attached metadata.
      // Here we simulate by checking if the content contains directive markers.
      const simulatedContent = message.role === "assistant" ? message.content.map(b => b.text).join(" ") : message.content;
      if (typeof simulatedContent === 'string') {
        const { style, group } = this.parseAdvancedDirective(simulatedContent);
        advancedDirectives = { style, group };
      }

      if (message.role === "user") {
        content = message.content;
      } else if (message.role === "assistant") {
        content = this.generateAssistantContent(message.content);
      } else if (message.role === "tool") {
        content = message.content;
      }

      const nodeId = `node${index}`;
      nodeDefinitions.push(this.generateNodeDefinition(
        nodeId,
        message,
        content,
        advancedDirectives
      ));
      nodeMap.set(nodeId, { message, content, directives: advancedDirectives });
    });

    // 2. Process Edges (Dependencies)
    for (let i = 0; i < messages.length - 1; i++) {
      const sourceId = `node${i}`;
      const targetId = `node${i + 1}`;
      const message = messages[i];
      const sourceDirectives = nodeMap.get(sourceId)!.directives;

      // For simplicity, we apply the source node's directives to the edge
      const edge = this.generateEdgeDefinition(
        sourceId,
        targetId,
        message,
        sourceDirectives
      );
      edgeDefinitions.push(edge);
    }

    // 3. Assemble Mermaid Syntax
    const graphSyntax = `graph TD\n${nodeDefinitions.join("\n")}\n\n${edgeDefinitions.join("\n")}`;

    return `%% Mermaid Graph: ${graphTitle} (Advanced V101)
${graphSyntax}`;
  }
}

export { ToolCallDependencyGraphVisualizerMermaidAdvancedV101 };