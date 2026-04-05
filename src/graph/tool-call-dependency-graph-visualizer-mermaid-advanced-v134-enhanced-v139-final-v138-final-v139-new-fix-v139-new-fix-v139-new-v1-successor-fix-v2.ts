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

export type ConditionNode = {
  id: string;
  description: string;
  outcomes: {
    condition: string;
    nextNodeId: string;
  }[];
};

export type LoopNode = {
  id: string;
  description: string;
  loopCondition: string;
  exitNodeId: string;
};

export type GraphContext = {
  nodes: Record<string, {
    type: "start" | "tool_call" | "condition" | "loop" | "end";
    description: string;
    metadata: Record<string, any>;
  }>;
  edges: {
    from: string;
    to: string;
    label?: string;
    type?: "default" | "conditional" | "loop_back";
  }[];
  conditionals?: Record<string, ConditionNode>;
  loops?: Record<string, LoopNode>;
};

interface GraphBuilder {
  buildMermaid(context: GraphContext): string;
}

class GraphBuilderImpl implements GraphBuilder {
  buildMermaid(context: GraphContext): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes
    const nodeDefinitions: { [key: string]: string } = {};
    for (const nodeId in context.nodes) {
      const node = context.nodes[nodeId];
      let definition = `${nodeId}["${node.description}"];`;

      switch (node.type) {
        case "tool_call":
          const toolUse = node.metadata.tool_use as ToolUseBlock | undefined;
          if (toolUse) {
            definition = `${nodeId}["Tool: ${toolUse.name} | Input: ${JSON.stringify(toolUse.input)}"];`;
          }
          break;
        case "condition":
          definition = `${nodeId}["Condition: ${node.description}"];`;
          break;
        case "loop":
          definition = `${nodeId}["Loop: ${node.description} (Condition: ${context.loops![nodeId].loopCondition})"];`;
          break;
        case "start":
          definition = `${nodeId}["Start"];`;
          break;
        case "end":
          definition = `${nodeId}["End"];`;
          break;
      }
      nodeDefinitions[nodeId] = definition;
    }

    for (const def of Object.values(nodeDefinitions)) {
      mermaid += def + "\n";
    }

    // 2. Define Edges
    for (const edge of context.edges) {
      let edgeSyntax = `${edge.from} --> ${edge.to}`;
      let label = edge.label ? `\n    -- ${edge.label} --\n` : "";

      if (edge.type === "conditional") {
        const condition = context.conditionals![edge.from];
        const outcome = condition.outcomes.find(o => o.nextNodeId === edge.to);
        if (outcome) {
          edgeSyntax = `${edge.from} -- "${outcome.condition}" --> ${edge.to}`;
        }
      } else if (edge.type === "loop_back") {
        const loopNode = context.loops![edge.from];
        if (loopNode) {
          edgeSyntax = `${edge.from} -- "Loop Back" --> ${edge.to}`;
        }
      } else if (edge.label) {
        edgeSyntax = `${edge.from} -- "${edge.label}" --> ${edge.to}`;
      } else {
        edgeSyntax = `${edge.from} --> ${edge.to}`;
      }
      mermaid += edgeSyntax + "\n";
    }

    return mermaid;
  }
}

export class GraphVisualizer {
  private builder: GraphBuilder;

  constructor() {
    this.builder = new GraphBuilderImpl();
  }

  public buildGraphMermaid(context: GraphContext): string {
    return this.builder.buildMermaid(context);
  }
}