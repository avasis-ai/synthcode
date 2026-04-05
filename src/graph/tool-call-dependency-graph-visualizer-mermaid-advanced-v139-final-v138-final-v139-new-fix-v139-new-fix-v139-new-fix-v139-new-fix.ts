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
    label: string;
    description: string;
    type: "start" | "process" | "decision" | "end";
    connections: {
      targetId: string;
      condition?: string;
    }[];
  }>;
  edges: {
    from: string;
    to: string;
    label: string;
    condition?: string;
  }[];
  flowControl: {
    type: "if" | "loop";
    startNodeId: string;
    endNodeId: string;
    branches: {
      condition: string;
      targetNodeId: string;
    }[];
  }[];
}

export class ToolCallDependencyGraphVisualizer {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateNodeSyntax(nodeId: string, node: typeof this.context.nodes[string]): string {
    const shape = {
      start: "([",
      process: "[[]]",
      decision: "{[]}",
      end: "(( ))",
    }[node.type] || "[[]]";

    return `${nodeId} ${shape} ${node.label} ${shape.replace(/[\(\[\]]/g, "")}`;
  }

  private generateEdgeSyntax(edge: { from: string; to: string; label: string; condition?: string }): string {
    let syntax = `${edge.from} --> ${edge.to}`;
    if (edge.label) {
      syntax += ` : ${edge.label}`;
    }
    if (edge.condition) {
      syntax += ` {${edge.condition}}`;
    }
    return syntax;
  }

  private generateFlowControlSyntax(flow: typeof this.context.flowControl[0]): string {
    let syntax = "";
    if (flow.type === "if") {
      syntax += `\nif ${flow.startNodeId} {`;
      flow.branches.forEach(branch => {
        syntax += `\n    ${branch.condition} --> ${branch.targetNodeId} : ${branch.condition} (Else)`;
      });
      syntax += `\n} else { ${flow.endNodeId} }`;
    } else if (flow.type === "loop") {
      syntax += `\nloop ${flow.startNodeId} --> ${flow.endNodeId} : Loop Iteration`;
    }
    return syntax;
  }

  public generateGraphMermaid(context: GraphContext): string {
    let mermaid = "graph TD\n";

    // 1. Nodes
    Object.entries(context.nodes).forEach(([id, node]) => {
      mermaid += this.generateNodeSyntax(id, node) + "\n";
    });

    // 2. Edges
    context.edges.forEach(edge => {
      mermaid += this.generateEdgeSyntax(edge) + "\n";
    });

    // 3. Flow Control (Overwrites/enhances structure)
    context.flowControl.forEach(flow => {
      mermaid += this.generateFlowControlSyntax(flow);
    });

    return mermaid;
  }
}