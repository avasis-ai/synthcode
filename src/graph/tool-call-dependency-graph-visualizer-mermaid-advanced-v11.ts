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

type GraphNodeId = string;

interface EdgeConfig {
  source: GraphNodeId;
  target: GraphNodeId;
  label: string;
  weight?: number;
  condition?: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV11 {
  private messages: Message[];
  private nodes: Map<GraphNodeId, string> = new Map();
  private edges: EdgeConfig[] = [];

  constructor(messages: Message[]) {
    this.messages = messages;
  }

  private generateNodeId(messageIndex: number, role: "user" | "assistant" | "tool"): GraphNodeId {
    return `${role}-${messageIndex}`;
  }

  private processMessage(message: Message, index: number): {
    id: GraphNodeId;
    mermaidContent: string;
  } {
    let id: GraphNodeId;
    let content: string;

    if (message.role === "user") {
      id = this.generateNodeId(index, "user");
      content = `User Input: ${message.content.substring(0, 50)}...`;
    } else if (message.role === "assistant") {
      id = this.generateNodeId(index, "assistant");
      const blocks = (message as AssistantMessage).content;
      let contentParts: string[] = [];
      for (const block of blocks) {
        if (block.type === "text") {
          contentParts.push(`Text: ${block.text.substring(0, 50)}...`);
        } else if (block.type === "tool_use") {
          contentParts.push(`Tool Call: ${block.name}(${JSON.stringify(block.input)})`);
        } else if (block.type === "thinking") {
          contentParts.push(`Thinking: ${block.thinking.substring(0, 50)}...`);
        }
      }
      content = `Assistant Response: ${contentParts.join(" | ")}`;
    } else {
      const toolResult = message as ToolResultMessage;
      id = this.generateNodeId(index, "tool");
      content = `Tool Result (${toolResult.tool_use_id}): ${toolResult.content.substring(0, 50)}... ${toolResult.is_error ? "(ERROR)" : ""}`;
    }

    return { id, mermaidContent: `${id}["${content}"]` };
  }

  private extractEdges(message: Message, index: number): EdgeConfig[] {
    const edges: EdgeConfig[] = [];
    if (message.role === "assistant") {
      const blocks = (message as AssistantMessage).content;
      let lastId: GraphNodeId | null = null;

      for (const block of blocks) {
        if (block.type === "tool_use") {
          const toolUseId = `tool_use_${block.id}`;
          const sourceId = this.generateNodeId(index, "assistant");
          
          // Link from assistant thought/text to the tool call node
          edges.push({
            source: sourceId,
            target: toolUseId,
            label: `Calls ${block.name}`,
          });
          lastId = toolUseId;
        }
      }
    } else if (message.role === "tool") {
      const toolResult = message as ToolResultMessage;
      const sourceId = this.generateNodeId(index, "tool");
      
      // Link from previous step to the tool result
      if (this.messages[this.messages.indexOf(message) - 1]) {
        const prevMsg = this.messages[this.messages.indexOf(message) - 1];
        const prevId = this.generateNodeId(this.messages.indexOf(message) - 1, prevMsg.role as "user" | "assistant" | "tool");
        edges.push({
          source: prevId,
          target: sourceId,
          label: "Executes Tool",
        });
      }
      lastId = sourceId;
    }
    return edges;
  }

  public visualize(mermaidGraphTitle: string = "Tool Call Dependency Graph"): string {
    this.nodes.clear();
    this.edges = [];

    let messageIndex = 0;
    for (const message of this.messages) {
      const { id: nodeId, mermaidContent: nodeContent } = this.processMessage(message, messageIndex);
      this.nodes.set(nodeId, nodeContent);

      const currentEdges = this.extractEdges(message, messageIndex);
      this.edges.push(...currentEdges);
      
      messageIndex++;
    }

    let mermaidCode = `graph TD\n`;
    mermaidCode += `%% ${mermaidGraphTitle} v1.1\n`;
    
    // Define nodes
    this.nodes.forEach((content, id) => {
      mermaidCode += `    ${id}["${content}"]\n`;
    });

    // Define edges
    this.edges.forEach(edge => {
      let edgeStr = `${edge.source} --> ${edge.target}`;
      let label = edge.label ? `\n    ${edge.source} -- "${edge.label}" --> ${edge.target}` : '';
      
      if (edge.weight !== undefined) {
        label += `\n    ${edge.source} -- "${edge.label}" [weight:${edge.weight}] --> ${edge.target}`;
      } else if (edge.condition) {
        label += `\n    ${edge.source} -- "${edge.label}" {condition: ${edge.condition}} --> ${edge.target}`;
      } else {
        label += `\n    ${edge.source} -- "${edge.label}" --> ${edge.target}`;
      }
      mermaidCode += label + "\n";
    });

    return mermaidCode;
  }

  public serializeEnhancedGraph(mermaidGraphTitle: string = "Advanced Tool Call Dependency Graph"): string {
    this.nodes.clear();
    this.edges = [];

    let messageIndex = 0;
    for (const message of this.messages) {
      const { id: nodeId, mermaidContent: nodeContent } = this.processMessage(message, messageIndex);
      this.nodes.set(nodeId, nodeContent);

      const currentEdges = this.extractEdges(message, messageIndex);
      this.edges.push(...currentEdges);
      
      messageIndex++;
    }

    let mermaidCode = `graph TD\n`;
    mermaidCode += `%% ${mermaidGraphTitle} v1.1 (Advanced)\n`;
    
    // Define nodes
    this.nodes.forEach((content, id) => {
      mermaidCode += `    ${id}["${content}"]\n`;
    });

    // Define edges, implementing advanced syntax handling
    this.edges.forEach(edge => {
      let edgeDefinition = "";
      
      if (edge.weight !== undefined) {
        edgeDefinition = `${edge.source} -- "${edge.label}" [weight:${edge.weight}] --> ${edge.target}`;
      } else if (edge.condition) {
        edgeDefinition = `${edge.source} -- "${edge.label}" {condition: ${edge.condition}} --> ${edge.target}`;
      } else {
        edgeDefinition = `${edge.source} -- "${edge.label}" --> ${edge.target}`;
      }
      
      mermaidCode += `    ${edgeDefinition}\n`;
    });

    return mermaidCode;
  }
}