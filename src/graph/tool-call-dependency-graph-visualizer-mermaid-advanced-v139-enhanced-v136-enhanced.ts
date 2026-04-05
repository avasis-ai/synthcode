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

export interface GraphContext {
  messages: Message[];
  toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
  flowControlPoints: {
    type: "conditional" | "loop";
    description: string;
    sourceNodeId: string;
    targetNodeId: string;
  }[];
}

export class ToolCallDependencyGraphVisualizer {
  private readonly mermaidGraphType: string = "graph TD";

  generateGraph(context: GraphContext): string {
    let mermaidCode = this.mermaidGraphType + "\n";

    const nodes = this.generateNodes(context);
    mermaidCode += this.formatNodes(nodes);

    const edges = this.generateEdges(context);
    mermaidCode += this.formatEdges(edges);

    return mermaidCode;
  }

  private generateNodes(context: GraphContext): string[] {
    const nodes: string[] = [];
    let nodeIdCounter = 1;

    // 1. Process Messages (User/Assistant/Tool)
    context.messages.forEach((message, index) => {
      const nodeId = `M${index}`;
      let label = "";

      if (message.role === "user") {
        label = `User Input: ${message.content.substring(0, 30)}...`;
        nodes.push(`    ${nodeId}["${label}"]:::user`);
      } else if (message.role === "assistant") {
        const content = message.content.map(block => {
          if (block.type === "text") return block.text.substring(0, 30) + "...";
          if (block.type === "tool_use") return `Tool Call: ${block.name}(${JSON.stringify(block.input)})`;
          if (block.type === "thinking") return `Thinking: ${block.thinking.substring(0, 30)}...`;
          return "";
        }).join(" | ");
        label = `Assistant Response\n(${content})`;
        nodes.push(`    ${nodeId}["${label}"]:::assistant`);
      } else if (message.role === "tool") {
        label = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
        nodes.push(`    ${nodeId}["${label}"]:::tool`);
      }
    });

    // 2. Process Tool Calls (If not fully captured in messages)
    context.toolCalls.forEach((toolCall, index) => {
      const nodeId = `T${index}`;
      const label = `Tool Call: ${toolCall.name}(${JSON.stringify(toolCall.input)})`;
      nodes.push(`    ${nodeId}["${label}"]:::tool-call`);
    });

    // 3. Process Flow Control Points
    context.flowControlPoints.forEach((fcp, index) => {
      const nodeId = `F${index}`;
      let label = "";
      if (fcp.type === "conditional") {
        label = `Conditional Branching: ${fcp.description}`;
        nodes.push(`    ${nodeId}["${label}"]:::flow-control`);
      } else if (fcp.type === "loop") {
        label = `Loop Detected: ${fcp.description}`;
        nodes.push(`    ${nodeId}["${label}"]:::flow-control`);
      }
    });

    return nodes;
  }

  private formatNodes(nodes: string[]): string {
    let nodeDefinitions = "";
    const styles = `
    classDef user fill:#ccf,stroke:#333,stroke-width:2px;
    classDef assistant fill:#cff,stroke:#333,stroke-width:2px;
    classDef tool fill:#ffc,stroke:#333,stroke-width:2px;
    classDef tool-call fill:#fcc,stroke:#333,stroke-width:2px;
    classDef flow-control fill:#ddf,stroke:#a0a,stroke-width:2px;
    `;
    return `${nodes.join("\n")}\n${styles}`;
  }

  private generateEdges(context: GraphContext): string[] {
    const edges: string[] = [];

    // Edges from sequential messages
    for (let i = 0; i < context.messages.length - 1; i++) {
      const sourceId = `M${i}`;
      const targetId = `M${i + 1}`;
      edges.push(`${sourceId} -->|Sequential| ${targetId}`);
    }

    // Edges from Tool Calls to subsequent steps (Simplified connection)
    context.toolCalls.forEach((toolCall, index) => {
      const sourceId = `T${index}`;
      // Connect tool call to the next message if it exists
      if (context.messages.length > 0) {
        const nextMessageId = `M${Math.min(index + 1, context.messages.length - 1)}`;
        edges.push(`${sourceId} -->|Invokes| ${nextMessageId}`);
      }
    });

    // Edges from Flow Control Points
    context.flowControlPoints.forEach((fcp, index) => {
      const sourceId = `F${index}`;
      if (fcp.type === "conditional") {
        edges.push(`${sourceId} -->|Condition Met| ${fcp.targetNodeId}`);
        edges.push(`${sourceId} -->|Condition Failed| ${fcp.sourceNodeId}`); // Self-loop or back to source for simplicity
      } else if (fcp.type === "loop") {
        edges.push(`${sourceId} -->|Loop Back| ${fcp.sourceNodeId}`);
      }
    });

    return edges;
  }

  private formatEdges(edges: string[]): string {
    return edges.join("\n");
  }
}