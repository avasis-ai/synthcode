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

interface DependencyNode {
  id: string;
  label: string;
  type: "user" | "assistant" | "tool_call" | "conditional";
  details?: Record<string, any>;
}

interface DependencyEdge {
  fromId: string;
  toId: string;
  condition?: string;
  label?: string;
}

abstract class GraphVisualizer {
  abstract toMermaidSyntax(nodes: DependencyNode[], edges: DependencyEdge[]): string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV139 extends GraphVisualizer {
  private readonly nodeMap: Map<string, DependencyNode> = new Map();
  private readonly edgeMap: DependencyEdge[] = [];

  private addNode(node: DependencyNode): void {
    this.nodeMap.set(node.id, node);
  }

  private addEdge(edge: DependencyEdge): void {
    this.edgeMap.push(edge);
  }

  private processMessage(message: Message): void {
    if (typeof message === "object" && message !== null) {
      if ("role" in message) {
        if (message.role === "user") {
          const userNodeId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          this.addNode({
            id: userNodeId,
            label: `User Input: ${message.content.substring(0, 30)}...`,
            type: "user",
          });
        } else if (message.role === "assistant") {
          const assistantNodeId = `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          let contentLabel = "Assistant Response";
          if (message.content.length > 50) {
            contentLabel = `Assistant Response: ${message.content.substring(0, 30)}...`;
          }
          this.addNode({
            id: assistantNodeId,
            label: contentLabel,
            type: "assistant",
          });
          // Simplified: In a real scenario, we'd parse ContentBlock[] for detailed nodes
        } else if (message.role === "tool") {
          const toolNodeId = `tool_result_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          this.addNode({
            id: toolNodeId,
            label: `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`,
            type: "tool_call",
            details: {
              error: message.is_error,
            },
          });
        }
      }
    }
  }

  public buildGraph(messages: Message[]): { nodes: DependencyNode[]; edges: DependencyEdge[] } {
    this.nodeMap.clear();
    this.edgeMap.length = 0;

    let previousNodeId: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      this.processMessage(message);

      if (previousNodeId) {
        const currentNodeId = this.nodeMap.keys().next().value; // Simplification: Use the last added node
        if (currentNodeId && previousNodeId) {
          this.addEdge({
            fromId: previousNodeId,
            toId: currentNodeId,
            label: "->",
          });
        }
      }
      previousNodeId = this.nodeMap.keys().next().value;
    }

    return {
      nodes: Array.from(this.nodeMap.values()),
      edges: [...this.edgeMap],
    };
  }

  public toMermaidSyntax(nodes: DependencyNode[], edges: DependencyEdge[]): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes
    const nodeDefinitions: string[] = nodes.map(node => {
      let shape = "rounded";
      let classDef = "";
      switch (node.type) {
        case "user":
          shape = "hexagon";
          classDef = "classDef user fill:#ADD8E6,stroke:#333,stroke-width:2px";
          break;
        case "assistant":
          shape = "stadium";
          classDef = "classDef assistant fill:#90EE90,stroke:#333,stroke-width:2px";
          break;
        case "tool_call":
          shape = "cylinder";
          classDef = "classDef tool fill:#FFD700,stroke:#333,stroke-width:2px";
          break;
        case "conditional":
          shape = "diamond";
          classDef = "classDef condition fill:#FFA07A,stroke:#333,stroke-width:2px";
          break;
      }
      return `${node.id}["${node.label}"]:::${classDef.split(' ')[1]}`;
    }).join('\n');

    mermaid += `${nodeDefinitions}\n`;

    // 2. Define Edges
    const edgeDefinitions: string[] = edges.map(edge => {
      let edgeSyntax = `${edge.fromId} --> ${edge.toId}`;
      if (edge.condition) {
        edgeSyntax = `${edge.fromId} -- "${edge.condition}" --> ${edge.toId}`;
      } else if (edge.label) {
        edgeSyntax = `${edge.fromId} -- "${edge.label}" --> ${edge.toId}`;
      }
      return edgeSyntax;
    }).join('\n');

    mermaid += `${edgeDefinitions}\n`;

    // 3. Apply general styling (for robustness)
    mermaid += "classDef default fill:#f9f9f9,stroke:#ccc,stroke-width:1px;\n";

    return mermaid.trim();
  }
}