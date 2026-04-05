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
  dependencies: {
    from: string;
    to: string;
    condition?: string;
    loop?: boolean;
  }[];
}

class ToolCallDependencyGraphVisualizerMermaidAdvancedV158 {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeId(messageIndex: number, callId: string): string {
    return `N${messageIndex}-${callId}`;
  }

  private generateNodeLabel(messageIndex: number, callId: string, type: string): string {
    const base = `Step ${messageIndex}`;
    if (type === "ToolCall") {
      return `${base} -> Tool: ${callId}`;
    }
    return base;
  }

  private generateMermaidNode(id: string, label: string, shape: string = "rounded"): string {
    return `    ${id}["${label}"]`;
  }

  private generateMermaidEdge(fromId: string, toId: string, condition: string | undefined, loop: boolean): string {
    let edge = `    ${fromId} --> ${toId}`;
    if (condition) {
      edge += `{${condition}}`;
    }
    if (loop) {
      edge = `    ${fromId} -- Loop --> ${toId}`;
    }
    return edge;
  }

  public generateMermaidGraph(): string {
    let mermaid = "graph TD\n";
    let nodes: string[] = [];
    let edges: string[] = [];

    // 1. Process Messages/Steps for Nodes
    this.context.messages.forEach((message, msgIndex) => {
      if (message.role === "user") {
        const nodeId = `User${msgIndex}`;
        nodes.push(this.generateMermaidNode(nodeId, `User Input (${msgIndex})`));
      } else if (message.role === "assistant") {
        const assistantMsg = message as AssistantMessage;
        let currentId = `Assistant${msgIndex}`;
        nodes.push(this.generateMermaidNode(currentId, `Assistant Output (${msgIndex})`));

        assistantMsg.content.filter((block): block is ToolUseBlock => block.type === "tool_use").forEach((toolUseBlock, toolUseIndex) => {
          const callId = `T${msgIndex}-${toolUseIndex}`;
          const toolCallNodeId = this.generateNodeId(msgIndex, callId);
          nodes.push(this.generateMermaidNode(toolCallNodeId, `Call: ${toolUseBlock.name} (${callId})`, "rhombus"));
        });
      } else if (message.role === "tool") {
        const toolResultMsg = message as ToolResultMessage;
        const nodeId = `ToolResult${this.context.toolCalls.findIndex(tc => tc.id === toolResultMsg.tool_use_id) || 0}`;
        nodes.push(this.generateMermaidNode(nodeId, `Tool Result (${toolResultMsg.tool_use_id})`, "hexagon"));
      }
    });

    // 2. Process Dependencies for Edges
    this.context.dependencies.forEach((dep, index) => {
      const edge = this.generateMermaidEdge(
        dep.from,
        dep.to,
        dep.condition,
        dep.loop || false
      );
      edges.push(edge);
    });

    // 3. Assemble Final Graph
    let graphBody = nodes.join("\n") + "\n";
    graphBody += edges.join("\n");

    return `%% Mermaid Graph: Tool Call Dependency Flow\n${graphBody}\n`;
  }
}

export { ToolCallDependencyGraphVisualizerMermaidAdvancedV158 };