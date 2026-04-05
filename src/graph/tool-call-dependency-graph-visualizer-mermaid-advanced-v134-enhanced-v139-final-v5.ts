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

interface DependencyGraphNode {
  id: string;
  type: "start" | "tool_call" | "conditional" | "fallback" | "end";
  label: string;
  details?: Record<string, unknown>;
}

interface DependencyGraphEdge {
  fromId: string;
  toId: string;
  label: string;
  condition?: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV139FinalV5 {
  private nodes: DependencyGraphNode[] = [];
  private edges: DependencyGraphEdge[] = [];

  constructor() {}

  private addNode(node: DependencyGraphNode): void {
    this.nodes.push(node);
  }

  private addEdge(edge: DependencyGraphEdge): void {
    this.edges.push(edge);
  }

  public buildGraph(
    messages: Message[],
    initialNodeId: string = "start",
  ): void {
    this.nodes = [];
    this.edges = [];

    this.addNode({ id: "start", type: "start", label: "Start Process" });

    let currentNodeId: string = initialNodeId;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      let nextNodeId: string | null = null;

      if (message.role === "user") {
        const userNodeId = `user_${i}`;
        this.addNode({ id: userNodeId, type: "tool_call", label: `User Input: ${message.content.substring(0, 30)}...` });
        this.addEdge({ fromId: currentNodeId, toId: userNodeId, label: "Trigger" });
        currentNodeId = userNodeId;
        nextNodeId = userNodeId;
      } else if (message.role === "assistant") {
        const assistantNodeId = `assistant_${i}`;
        let contentSummary = "No content";
        let hasToolUse = false;

        const toolUses: ToolUseBlock[] = [];
        const textBlocks: TextBlock[] = [];

        for (const block of message.content) {
          if (block.type === "tool_use") {
            toolUses.push(block as ToolUseBlock);
            hasToolUse = true;
          } else if (block.type === "text") {
            textBlocks.push(block as TextBlock);
            contentSummary += (contentSummary === "No content" ? "" : " | ") + block.text.substring(0, 20);
          }
        }

        if (toolUses.length > 0) {
          const toolCallId = `tool_call_${i}`;
          this.addNode({
            id: toolCallId,
            type: "tool_call",
            label: `Tool Call: ${toolUses[0].name}`,
            details: { tool_uses: toolUses },
          });
          this.addEdge({ fromId: currentNodeId, toId: toolCallId, label: "Generate Tool Call" });
          currentNodeId = toolCallId;
          nextNodeId = toolCallId;
        } else {
          this.addNode({
            id: assistantNodeId,
            type: "tool_call",
            label: `Response: ${contentSummary}`,
            details: { content: message.content },
          });
          this.addEdge({ fromId: currentNodeId, toId: assistantNodeId, label: "Respond" });
          currentNodeId = assistantNodeId;
          nextNodeId = assistantNodeId;
        }
      } else if (message.role === "tool") {
        const toolResultNodeId = `tool_result_${message.tool_use_id}`;
        const isError = message.content.includes("ERROR");
        const resultLabel = isError ? `Tool Error` : `Tool Result`;

        this.addNode({
          id: toolResultNodeId,
          type: "fallback",
          label: `${resultLabel}: ${message.content.substring(0, 30)}...`,
          details: { error: isError, content: message.content },
        });
        this.addEdge({ fromId: currentNodeId, toId: toolResultNodeId, label: "Tool Output Received" });
        currentNodeId = toolResultNodeId;
        nextNodeId = toolResultNodeId;
      }
    }

    this.addNode({ id: "end", type: "end", label: "End Process" });
    if (currentNodeId && currentNodeId !== "end") {
      this.addEdge({ fromId: currentNodeId, toId: "end", label: "Finish" });
    }
  }

  public generateMermaidSyntax(): string {
    let mermaid = "graph TD\n";

    const nodeDefinitions: string[] = this.nodes.map((node) => {
      let shape = "([");
      if (node.type === "start") shape = "((";
      if (node.type === "end") shape = "((";
      if (node.type === "conditional") shape = "{";
      if (node.type === "fallback") shape = "[";
      if (node.type === "tool_call") shape = "([";

      return `${node.id} ${shape} ${node.label} ${shape.slice(0, -1)})`;
    });

    mermaid += nodeDefinitions.join("\n    ");

    const edgeDefinitions: string[] = this.edges.map((edge) => {
      let edgeSyntax = `${edge.fromId} --> ${edge.toId}`;
      if (edge.condition) {
        edgeSyntax += `{${edge.condition}}`;
      } else {
        edgeSyntax += `["${edge.label}"]`;
      }
      return edgeSyntax;
    });

    mermaid += "\n";
    mermaid += edgeDefinitions.join("\n    ");

    return mermaid;
  }
}