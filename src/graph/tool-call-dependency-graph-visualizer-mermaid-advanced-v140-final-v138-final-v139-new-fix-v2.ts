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
  nodes: Record<string, {
    id: string;
    label: string;
    type: "start" | "process" | "decision" | "end";
    details?: Record<string, any>;
  }>;
  edges: {
    from: string;
    to: string;
    label: string;
    condition?: string;
    type: "call" | "flow";
  }[];
  flowControl?: {
    type: "loop";
    startNodeId: string;
    endNodeId: string;
    condition: string;
  } | {
    type: "conditional";
    nodeId: string;
    outcomes: {
      condition: string;
      targetNodeId: string;
    }[];
  };
}

export class ToolCallDependencyGraphVisualizerMermaidAdvanced {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeDefinition(nodeId: string, node: GraphContext["nodes"][typeof nodeId]): string {
    let definition = `${nodeId}["${node.label}"]`;
    if (node.type === "decision") {
      definition += ":::decision";
    } else if (node.type === "start") {
      definition += ":::start";
    } else if (node.type === "end") {
      definition += ":::end";
    }
    return definition;
  }

  private generateEdgeDefinition(edge: typeof this["context"]["edges"][number]): string {
    let edgeStr = `${edge.from} -->`;
    if (edge.condition) {
      edgeStr += `|${edge.condition}|`;
    } else {
      edgeStr += "";
    }
    edgeStr += `${edge.to}`;
    return edgeStr;
  }

  private generateFlowControlDirectives(): string {
    let directives = "";

    if (this.context.flowControl?.type === "loop") {
      const loop = this.context.flowControl;
      directives += `\n%% Loop Definition: ${loop.condition} loop\n`;
      directives += `${loop.startNodeId} -- Loop Start --> ${loop.endNodeId}\n`;
      directives += `linkStyle ${loop.startNodeId} --> ${loop.endNodeId} stroke-width:2px,stroke:red;\n`;
    }

    if (this.context.flowControl?.type === "conditional") {
      const condition = this.context.flowControl;
      directives += `\n%% Conditional Branching at ${condition.nodeId}\n`;
      condition.outcomes.forEach((outcome) => {
        directives += `${condition.nodeId} -- ${outcome.condition} --> ${outcome.targetNodeId}\n`;
      });
    }
    return directives;
  }

  public generateMermaidGraph(context: GraphContext): string {
    let mermaid = "graph TD\n";

    // 1. Define all nodes
    let nodeDefinitions = Object.keys(context.nodes).map(nodeId =>
      this.generateNodeDefinition(nodeId, context.nodes[nodeId])
    ).join("\n");
    mermaid += "\n%% Nodes\n" + nodeDefinitions + "\n";

    // 2. Define all standard edges
    let edgeDefinitions = context.edges.map(this.generateEdgeDefinition).join("\n");
    mermaid += "\n%% Edges\n" + edgeDefinitions + "\n";

    // 3. Define complex flow control directives
    let flowDirectives = this.generateFlowControlDirectives();
    mermaid += flowDirectives;

    // 4. Add styling/metadata (optional but good practice)
    mermaid += "\n%% Styling\n";
    mermaid += ".start{fill:#ccf,stroke:#333,stroke-width:2px}\n";
    mermaid += ".end{fill:#fcc,stroke:#333,stroke-width:2px}\n";
    mermaid += ".decision{fill:#ffc,stroke:#333,stroke-width:2px}\n";

    return mermaid.trim();
  }
}