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

type NodeId = string;

interface ToolCallNode {
  id: NodeId;
  message: Message;
  toolName: string;
  toolUseId: string;
}

interface FlowControlNode {
  id: NodeId;
  type: "start" | "end" | "conditional";
  description: string;
  condition?: string;
}

interface DependencyEdge {
  fromId: NodeId;
  toId: NodeId;
  label: string;
  type: "direct" | "conditional";
}

interface ConditionalEdge {
  fromId: NodeId;
  toId: NodeId;
  condition: string;
}

type GraphNodes = {
  toolCalls: ToolCallNode[];
  flowControls: FlowControlNode[];
};

type GraphEdges = {
  dependencies: DependencyEdge[];
  conditionals: ConditionalEdge[];
};

class GraphBuilder {
  private nodes: GraphNodes = {
    toolCalls: [],
    flowControls: [],
  };
  private edges: GraphEdges = {
    dependencies: [],
    conditionals: [],
  };

  public addToolCallNode(
    id: NodeId,
    message: Message,
    toolName: string,
    toolUseId: string
  ): this {
    this.nodes.toolCalls.push({
      id,
      message,
      toolName,
      toolUseId,
    });
    return this;
  }

  public addFlowControlNode(
    id: NodeId,
    type: "start" | "end" | "conditional",
    description: string,
    condition?: string
  ): this {
    this.nodes.flowControls.push({
      id,
      type,
      description,
      condition,
    });
    return this;
  }

  public addDependencyEdge(
    fromId: NodeId,
    toId: NodeId,
    label: string,
    type: "direct" | "conditional"
  ): this {
    if (type === "direct") {
      this.edges.dependencies.push({
        fromId,
        toId,
        label,
        type: "direct",
      });
    } else {
      this.edges.conditionals.push({
        fromId,
        toId,
        condition: label,
      });
    }
    return this;
  }

  public addConditionalEdge(
    fromId: NodeId,
    toId: NodeId,
    condition: string
  ): this {
    this.edges.conditionals.push({
      fromId: fromId,
      toId: toId,
      condition: condition,
    });
    return this;
  }

  public generateMermaidGraph(): string {
    let mermaid = "graph TD\n";

    const nodeStyle = (id: NodeId, label: string, type: "tool" | "flow"): string => {
      if (type === "tool") {
        return `    ${id}["Tool: ${label}"]:::tool-call`;
      }
      return `    ${id}["${label}"]:::flow-control`;
    };

    // 1. Define Nodes
    this.nodes.toolCalls.forEach((node) => {
      const label = `${node.toolName} (${node.toolUseId})`;
      mermaid += nodeStyle(node.id, label, "tool") + "\n";
    });

    this.nodes.flowControls.forEach((node) => {
      const label = node.description;
      mermaid += nodeStyle(node.id, label, "flow") + "\n";
    });

    // 2. Define Edges
    this.edges.dependencies.forEach((edge) => {
      mermaid += `    ${edge.fromId} -->|${edge.label}| ${edge.toId};\n`;
    });

    this.edges.conditionals.forEach((edge) => {
      mermaid += `    ${edge.fromId} -->|${edge.condition}| ${edge.toId};\n`;
    });

    // 3. Define Styles (Mermaid Class Definitions)
    mermaid += "\n%% Styles\n";
    mermaid += "classDef tool-call fill:#b3e5fc,stroke:#0288d1,stroke-width:2px;\n";
    mermaid += "classDef flow-control fill:#e0f7fa,stroke:#00bcd4,stroke-width:2px;\n";

    return mermaid.trim();
  }
}

export const createGraphBuilder = (): GraphBuilder => {
  return new GraphBuilder();
};