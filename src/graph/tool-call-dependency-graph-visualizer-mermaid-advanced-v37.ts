import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export type ConditionalEdge = {
  fromToolUseId: string;
  condition: "success" | "failure" | "condition_met" | "condition_not_met";
  toToolUseId: string;
  label?: string;
};

export type GraphEdge = {
  from: string;
  to: string;
  label?: string;
  isConditional?: boolean;
};

export class ToolCallDependencyGraphVisualizer {
  private messages: Message[];
  private edges: GraphEdge[] = [];

  constructor(messages: Message[]) {
    this.messages = messages;
  }

  private extractToolUseIds(messages: Message[]): Set<string> {
    const toolUseIds = new Set<string>();
    for (const message of messages) {
      if (message.role === "assistant") {
        for (const block of (message as any).content) {
          if (block.type === "tool_use") {
            toolUseIds.add(block.id);
          }
        }
      }
    }
    return toolUseIds;
  }

  private extractToolResultIds(messages: Message[]): Set<string> {
    const toolResultIds = new Set<string>();
    for (const message of messages) {
      if (message.role === "tool") {
        toolResultIds.add(message.tool_use_id);
      }
    }
    return toolResultIds;
  }

  public addConditionalEdge(edge: ConditionalEdge): void {
    this.edges.push({
      from: edge.fromToolUseId,
      to: edge.toToolUseId,
      label: edge.label || "",
      isConditional: true,
    });
  }

  public buildGraph(conditionalEdges: ConditionalEdge[] = []): string {
    this.edges = [];

    // 1. Process sequential and simple tool calls
    const toolUseIds = this.extractToolUseIds(this.messages);
    const toolResultIds = this.extractToolResultIds(this.messages);

    let lastToolUseId: string | null = null;

    for (let i = 0; i < this.messages.length - 1; i++) {
      const currentMessage = this.messages[i];
      const nextMessage = this.messages[i + 1];

      if (currentMessage.role === "assistant" && nextMessage.role === "tool") {
        const toolUseBlock = (currentMessage as any).content.find(
          (block: any) => block.type === "tool_use"
        );
        if (toolUseBlock && nextMessage.tool_use_id === toolUseBlock.id) {
          const edge: GraphEdge = {
            from: toolUseBlock.id,
            to: nextMessage.tool_use_id,
            label: "Executed",
          };
          this.edges.push(edge);
          lastToolUseId = toolUseBlock.id;
        }
      }
    }

    // 2. Process explicit conditional edges
    conditionalEdges.forEach(edge => {
      this.edges.push({
        from: edge.fromToolUseId,
        to: edge.toToolUseId,
        label: edge.label || "",
        isConditional: true,
      });
    });

    // 3. Generate Mermaid syntax
    let mermaidGraph = "graph TD\n";
    const nodes = new Set<string>();

    // Collect all unique nodes (Tool Uses and Tool Results)
    this.messages.forEach(message => {
      if (message.role === "assistant") {
        for (const block of (message as any).content) {
          if (block.type === "tool_use") {
            nodes.add(`T_Use_${block.id}`);
          }
        }
      }
      if (message.role === "tool") {
        nodes.add(`T_Result_${message.tool_use_id}`);
      }
    });

    // Define nodes (using a simplified representation for visualization)
    nodes.forEach(nodeId => {
      mermaidGraph += `${nodeId}["${nodeId.replace(/_/g, ' ')}"]\n`;
    });

    // Define edges
    this.edges.forEach(edge => {
      let label = edge.label || "";
      let edgeSyntax = `${edge.from} -->|${label}| ${edge.to}`;

      if (edge.isConditional) {
        const conditionMap: Record<string, string> = {
          "success": "Success",
          "failure": "Failure",
          "condition_met": "Condition Met",
          "condition_not_met": "Condition Not Met",
        };
        const conditionLabel = conditionMap[edge.from] || label;
        edgeSyntax = `${edge.from} -->|${conditionLabel}| ${edge.to}`;
      }
      mermaidGraph += edgeSyntax + "\n";
    });

    return mermaidGraph;
  }
}