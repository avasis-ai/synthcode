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

export type FlowControlNode = {
  id: string;
  description: string;
  condition: "success" | "failure";
  successPathId: string;
  failurePathId: string;
};

interface ToolCallDependencyGraph {
  messages: Message[];
  flowControlNodes: FlowControlNode[];
}

export class ToolCallDependencyGraphVisualizer {
  private graphData: ToolCallDependencyGraph;

  constructor(graphData: ToolCallDependencyGraph) {
    this.graphData = graphData;
  }

  private generateToolCallNode(toolUse: ToolUseBlock, nodeId: string): string {
    return `  ${nodeId}["Tool Call: ${toolUse.name}\\nInput: ${JSON.stringify(toolUse.input).substring(0, 30)}..."]`;
  }

  private generateMessageNode(message: Message, nodeId: string): string {
    if (typeof message === "UserMessage") {
      return `  ${nodeId}["User Input: ${message.content.substring(0, 30)}..."]`;
    }
    if (typeof message === "AssistantMessage") {
      const content = message.content.map(block => {
        if (block.type === "text") return `Text: ${block.text.substring(0, 30)}...`;
        if (block.type === "tool_use") return `Tool Use: ${block.id} (${block.name})`;
        return "";
      }).join(" | ");
      return `  ${nodeId}["Assistant Response:\\n${content}"]`;
    }
    if (typeof message === "ToolResultMessage") {
      const errorStatus = message.is_error ? " (ERROR)" : "";
      return `  ${nodeId}["Tool Result (${message.tool_use_id})${errorStatus}\\nContent: ${message.content.substring(0, 30)}..."]`;
    }
    return `  ${nodeId}["Unknown Message Type"]`;
  }

  private generateFlowControlNode(node: FlowControlNode): string {
    return `  ${node.id}["Conditional Check:\\n${node.description}\\n(Success/Failure)"]`;
  }

  private generateEdges(toolUses: ToolUseBlock[], flowNodes: FlowControlNode[]): string {
    let edges = "";

    // Tool Use -> Flow Control
    toolUses.forEach((toolUse, index) => {
      const toolUseId = `tool_${index}`;
      const flowNode = flowNodes.find(fn => fn.description.includes(toolUse.name));
      if (flowNode) {
        edges += `  ${toolUseId} -->|Check Output| ${flowNode.id};\n`;
      }
    });

    // Flow Control -> Success/Failure Paths
    flowNodes.forEach(node => {
      edges += `  ${node.id} -->|Success| ${node.successPathId};\n`;
      edges += `  ${node.id} -->|Failure| ${node.failurePathId};\n`;
    });

    return edges;
  }

  public visualizeMermaidGraph(): string {
    let mermaidCode = "graph TD;\n";
    let nodeDefinitions: string[] = [];
    let edgeDefinitions: string[] = [];

    // 1. Process Messages (Simplified: just use the last few for structure)
    const messageNodes: { id: string, content: string }[] = [];
    const messageIds: string[] = [];
    let msgCounter = 0;

    this.graphData.messages.forEach((message, index) => {
      const id = `msg_${msgCounter++}`;
      const content = this.generateMessageNode(message, id);
      nodeDefinitions.push(content);
      messageNodes.push({ id, content });
      messageIds.push(id);
    });

    // 2. Process Tool Calls (Assuming tool uses are embedded in assistant messages)
    const toolUseNodes: { id: string, block: ToolUseBlock }[] = [];
    let toolUseCounter = 0;
    let currentToolUseId = "";

    this.graphData.messages.forEach((message, index) => {
      if (typeof message === "AssistantMessage") {
        (message as AssistantMessage).content.filter((block): block is ToolUseBlock =>
          block.type === "tool_use"
        ).forEach((block, blockIndex) => {
          const id = `tool_${toolUseCounter++}`;
          const toolUseBlock = block as ToolUseBlock;
          toolUseNodes.push({ id, block: toolUseBlock });
          nodeDefinitions.push(this.generateToolCallNode(toolUseBlock, id));
        });
      }
    });

    // 3. Process Flow Control Nodes
    const flowNodes: FlowControlNode[] = this.graphData.flowControlNodes;
    flowNodes.forEach((node, index) => {
      const id = `flow_${index}`;
      nodeDefinitions.push(this.generateFlowControlNode(node));
    });

    // 4. Generate Edges
    let edges = "";
    if (toolUseNodes.length > 0) {
      edges += this.generateEdges(toolUseNodes.map(t => t.block), flowNodes);
    }

    // 5. Assemble Final Graph
    mermaidCode += nodeDefinitions.join("\n") + "\n";
    mermaidCode += edges + "\n";

    return mermaidCode;
  }
}