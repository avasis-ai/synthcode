import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ConditionalEdge = {
  sourceId: string;
  targetId: string;
  condition: string;
};

export interface FlowControlNode {
  id: string;
  type: "conditional" | "loop";
  label: string;
  description: string;
  outgoingEdges: ConditionalEdge[];
}

export interface GraphContext {
  messages: Message[];
  toolCalls: ToolUseBlock[];
  flowControls: FlowControlNode[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV7 {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeId(messageIndex: number, blockIndex: number, prefix: string = "N") {
    return `${prefix}-${messageIndex}-${blockIndex}`;
  }

  private generateToolCallNode(toolUse: ToolUseBlock, messageIndex: number): string {
    const id = this.generateNodeId(messageIndex, 0, `T${toolUse.id.substring(0, 4)}`);
    return `    ${id}["Tool Call: ${toolUse.name}\\nInput: ${JSON.stringify(toolUse.input)}"]`;
  }

  private generateMessageNode(message: Message, messageIndex: number, blockIndex: number): string {
    const id = this.generateNodeId(messageIndex, blockIndex, `M${message.role.substring(0, 1)}`);
    if (message.role === "user") {
      return `    ${id}["User Input: ${message.content.text}"]`;
    }
    if (message.role === "assistant") {
      const content = message.content.filter((block): block is TextBlock | ToolUseBlock | ThinkingBlock => block.type !== "text" || (block as TextBlock).text.length > 0);
      const textContent = message.content.map(block => {
        if (block.type === "text") return `Text: ${block.text}`;
        if (block.type === "tool_use") return `Tool Use: ${block.id} (${block.name})`;
        if (block.type === "thinking") return `Thinking: ${block.thinking.substring(0, 30)}...`;
        return "";
      }).join(" | ");
      return `    ${id}["Assistant Response\\n${textContent}"]`;
    }
    if (message.role === "tool") {
      return `    ${id}["Tool Result (${message.tool_use_id}): ${message.content.substring(0, 50)}..."]`;
    }
    return `    ${id}["Unknown Message"]`;
  }

  private generateFlowControlNode(node: FlowControlNode, index: number): string {
    const id = node.id;
    let mermaidCode = `    ${id}["${node.label}\\n(${node.type.toUpperCase()})\\n${node.description}"]`;

    if (node.type === "conditional") {
      const edges = node.outgoingEdges.map(edge => {
        return `      --> |${edge.condition}| ${edge.targetId}`;
      }).join("\n");
      mermaidCode += `\n    ${id} --> |Default| ${node.outgoingEdges[0]?.targetId || 'N/A'}`;
      return mermaidCode;
    }
    if (node.type === "loop") {
      const edges = node.outgoingEdges.map(edge => {
        return `      --> |${edge.condition}| ${edge.targetId}`;
      }).join("\n");
      return `${mermaidCode}\n    ${id} --> |Exit| ${node.outgoingEdges.find(e => e.condition.includes("Exit"))?.targetId || 'N/A'}`;
    }
    return mermaidCode;
  }

  public renderMermaidGraph(): string {
    let mermaid = "graph TD\n";
    let nodeDefinitions: string[] = [];
    let edgeDefinitions: string[] = [];

    // 1. Process Messages and Tool Calls (Sequential Flow)
    let currentMessageIndex = 0;
    let lastNodeId: string | null = null;

    for (const message of this.context.messages) {
      const msgNodeId = this.generateNodeId(currentMessageIndex, 0, `M${message.role.substring(0, 1)}`);
      nodeDefinitions.push(this.generateMessageNode(message, currentMessageIndex, 0));
      
      if (lastNodeId) {
        edgeDefinitions.push(`${lastNodeId} --> ${msgNodeId}`);
      }
      lastNodeId = msgNodeId;
      currentMessageIndex++;
    }

    // 2. Process Tool Calls (Interspersed)
    let toolCallIndex = 0;
    for (const toolUse of this.context.toolCalls) {
      const toolNodeId = this.generateToolCallNode(toolUse, toolCallIndex);
      nodeDefinitions.push(toolNodeId);
      
      if (lastNodeId) {
        edgeDefinitions.push(`${lastNodeId} --> ${toolNodeId}`);
      }
      lastNodeId = toolNodeId;
      toolCallIndex++;
    }

    // 3. Process Flow Controls (Complex Logic)
    let flowControlDefinitions: string[] = [];
    for (let i = 0; i < this.context.flowControls.length; i++) {
      const node = this.context.flowControls[i];
      flowControlDefinitions.push(this.generateFlowControlNode(node, i));
      
      // Connect the last sequential node to the first flow control node if it hasn't been connected already
      if (lastNodeId && !edgeDefinitions.some(e => e.includes(node.id))) {
         edgeDefinitions.push(`${lastNodeId} --> ${node.id}`);
      }
      lastNodeId = node.id;
    }

    // Combine all parts
    mermaid += nodeDefinitions.join("\n") + "\n";
    mermaid += flowControlDefinitions.join("\n") + "\n";
    mermaid += edgeDefinitions.join("\n");

    return mermaid;
  }
}