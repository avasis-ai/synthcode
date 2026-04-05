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
  nodes: Map<string, {
    id: string;
    label: string;
    type: "user" | "assistant" | "tool" | "system";
    details?: Record<string, any>;
  }>;
  edges: {
    from: string;
    to: string;
    type: "call" | "response" | "dependency" | "conditional";
    label: string;
    condition?: string;
  }[];
  flowControlPoints: {
    id: string;
    type: "loop_start" | "loop_end" | "conditional_branch";
    metadata: Record<string, any>;
  }[];
}

export class ToolCallDependencyGraphVisualizer {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeDefinition(nodeId: string, node: {
    id: string;
    label: string;
    type: "user" | "assistant" | "tool" | "system";
    details?: Record<string, any>;
  }): string {
    let content = node.label;
    if (node.type === "user") {
      content = `User Input: ${node.label}`;
    } else if (node.type === "assistant") {
      content = `Assistant Response: ${node.label}`;
    } else if (node.type === "tool") {
      content = `Tool Result: ${node.label}`;
    }
    return `    ${nodeId}["${content}"]`;
  }

  private generateEdgeDefinition(edge: {
    from: string;
    to: string;
    type: "call" | "response" | "dependency" | "conditional";
    label: string;
    condition?: string;
  }): string {
    let edgeSyntax = `${edge.from} --> ${edge.to}`;
    let labelSyntax = `[${edge.label}]`;

    if (edge.type === "conditional" && edge.condition) {
      edgeSyntax = `${edge.from} -->|${edge.condition}| ${edge.to}`;
    } else if (edge.type === "dependency") {
      edgeSyntax = `${edge.from} -- "${edge.label}" --> ${edge.to}`;
    } else {
      edgeSyntax = `${edge.from} --> ${edge.to}`;
    }

    return `${edgeSyntax} ${labelSyntax}`;
  }

  private generateFlowControlSyntax(): string {
    let syntax = "";
    const { flowControlPoints } = this.context;

    for (const point of flowControlPoints) {
      if (point.type === "loop_start") {
        syntax += `\n    subgraph Loop_${point.id} ${point.metadata.description || ""}
    LoopStart_${point.id} --> LoopEnd_${point.id}
    end\n`;
      } else if (point.type === "loop_end") {
        syntax += `\n    subgraph Loop_${point.id} ${point.metadata.description || ""}
    LoopStart_${point.id} --> LoopEnd_${point.id}
    end\n`;
      } else if (point.type === "conditional_branch") {
        syntax += `\n    subgraph Condition_${point.id} ${point.metadata.description || ""}
    Start_${point.id} -->|True| TrueBranch_${point.id}
    Start_${point.id} -->|False| FalseBranch_${point.id}
    end\n`;
      }
    }
    return syntax;
  }

  public generateMermaidGraph(): string {
    let mermaid = "graph TD\n";

    // 1. Node Definitions
    let nodeDefinitions = "";
    for (const [id, node] of this.context.nodes.entries()) {
      nodeDefinitions += this.generateNodeDefinition(id, node);
    }
    mermaid += "\n%% --- Node Definitions ---\n" + nodeDefinitions + "\n";

    // 2. Edge Definitions
    let edgeDefinitions = "";
    for (const edge of this.context.edges) {
      edgeDefinitions += this.generateEdgeDefinition(edge);
    }
    mermaid += "\n%% --- Edge Definitions ---\n" + edgeDefinitions + "\n";

    // 3. Flow Control (Advanced v3)
    mermaid += this.generateFlowControlSyntax();

    return mermaid.trim();
  }
}