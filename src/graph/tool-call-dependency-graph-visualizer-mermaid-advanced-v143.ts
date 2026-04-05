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

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV143 {
  private graphNodes: Map<string, string> = new Map();
  private graphEdges: string[] = [];
  private readonly graphId: string = "ToolCallGraph";

  constructor() {}

  private addNode(id: string, label: string): void {
    this.graphNodes.set(id, label);
  }

  private addEdge(source: string, target: string, label?: string): void {
    this.graphEdges.push(`${source} -->|${label || ""}| ${target}`);
  }

  private processContentBlock(block: ContentBlock, nodeId: string): void {
    if (typeof block === "TextBlock") {
      const textBlock = block as TextBlock;
      this.addNode(nodeId, `Text: ${textBlock.text.substring(0, 30)}...`);
    } else if (typeof block === "ToolUseBlock") {
      const toolUseBlock = block as ToolUseBlock;
      const nodeId = `${nodeId}_${toolUseBlock.id}`;
      this.addNode(nodeId, `Tool Call: ${toolUseBlock.name}`);
    } else if (typeof block === "ThinkingBlock") {
      const thinkingBlock = block as ThinkingBlock;
      this.addNode(nodeId, `Thinking: ${thinkingBlock.thinking.substring(0, 30)}...`);
    }
  }

  private processMessage(message: Message, parentId: string): void {
    let currentId = parentId;

    if (message.role === "user") {
      const userMsg = message as UserMessage;
      this.addNode(currentId, `User Input`);
      this.addEdge(currentId, "Start", "Initiation");
    } else if (message.role === "assistant") {
      const assistantMsg = message as AssistantMessage;
      let stepId = `${currentId}_A`;
      this.addNode(stepId, "Assistant Response Start");

      for (const block of assistantMsg.content) {
        const blockId = `${stepId}_${Math.random().toString(36).substring(2, 9)}`;
        this.processContentBlock(block, blockId);
        this.addEdge(stepId, blockId, "Generates");
      }
      this.addEdge(stepId, "NextStep", "Continues");
    } else if (message.role === "tool") {
      const toolMsg = message as ToolResultMessage;
      const toolId = `${currentId}_T`;
      this.addNode(toolId, `Tool Result: ${toolMsg.tool_use_id}`);
      this.addEdge(currentId, toolId, toolMsg.is_error ? "Error" : "Success");
    }
  }

  /**
   * Generates the Mermaid graph definition string from a sequence of messages.
   * @param messages The sequence of messages representing the execution flow.
   * @returns The formatted Mermaid graph string.
   */
  public generateGraph(messages: Message[]): string {
    this.graphNodes.clear();
    this.graphEdges = [];

    if (messages.length === 0) {
      return "graph TD\n    A[No Graph Data]";
    }

    let lastNodeId: string = "Start";
    this.addNode("Start", "Graph Start");

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const currentContextId = `${i}_Context`;

      if (i === 0) {
        this.processMessage(message, "Start");
      } else {
        this.processMessage(message, lastNodeId);
      }
      lastNodeId = i === messages.length - 1 ? `${i}_End` : `${i + 1}_Context`;
    }

    const graphDefinition = `graph TD\n${Array.from(this.graphNodes.values()).map(label => `    ${label.replace(/[^a-zA-Z0-9]/g, '')}`)}`
    + "\n"
    + this.graphEdges.join("\n")
    + "\n    End[Graph End]";

    return graphDefinition;
  }
}