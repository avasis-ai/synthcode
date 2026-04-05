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
    condition: string;
    sourceNodeId: string;
    targetNodeId: string;
    details: Record<string, any>;
  }[];
  nodes: {
    id: string;
    type: "user" | "assistant" | "tool_result" | "start" | "end";
    content: string;
    metadata: Record<string, any>;
  }[];
}

export class ToolCallDependencyGraphVisualizer {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private getNodeLabel(node: typeof this["context"]["nodes"][number]): string {
    switch (node.type) {
      case "user":
        return `User Input: ${node.content.substring(0, 30)}...`;
      case "assistant":
        return `Assistant Action: ${node.content.substring(0, 30)}...`;
      case "tool_result":
        return `Tool Result: ${node.content.substring(0, 30)}...`;
      case "start":
        return "Start";
      case "end":
        return "End";
      default:
        return `Node ${node.id}`;
    }
  }

  private generateMermaidGraph(): string {
    let mermaid = "graph TD\n";

    // 1. Define Nodes
    const nodeMap = new Map<string, string>();
    this.context.nodes.forEach((node, index) => {
      const id = `N${index}`;
      const label = this.getNodeLabel(node);
      mermaid += `  ${id}["${label}"]\n`;
      nodeMap.set(node.id, id);
    });

    // 2. Define Edges (Sequential Flow)
    let lastNodeId: string | null = null;
    for (let i = 0; i < this.context.nodes.length; i++) {
      const nodeId = this.context.nodes[i].id;
      const currentNodeId = nodeMap.get(nodeId);
      if (lastNodeId && currentNodeId) {
        mermaid += `  ${lastNodeId} --> ${currentNodeId};\n`;
      }
      lastNodeId = currentNodeId;
    }

    // 3. Define Complex Flows (Tool Calls, Conditionals, Loops)
    this.context.flowControlPoints.forEach((flow, index) => {
      const sourceId = nodeMap.get(flow.sourceNodeId);
      const targetId = nodeMap.get(flow.targetNodeId);

      if (sourceId && targetId) {
        if (flow.type === "conditional") {
          mermaid += `  ${sourceId} -- Condition: ${flow.condition} --> ${targetId};\n`;
        } else if (flow.type === "loop") {
          mermaid += `  ${sourceId} -- Loop Back: ${flow.condition} --> ${targetId};\n`;
        }
      }
    });

    // 4. Add Tool Call Dependencies (If not covered by sequential flow)
    this.context.toolCalls.forEach((toolCall, index) => {
      const toolNodeId = `T${index}`;
      mermaid += `  ${toolNodeId}["Tool Call: ${toolCall.name}"]\n`;
      // Assume tool call happens after the last assistant message
      if (this.context.nodes.length > 0) {
        const lastNodeId = nodeMap.get(this.context.nodes[this.context.nodes.length - 1].id);
        if (lastNodeId) {
          mermaid += `  ${lastNodeId} --> ${toolNodeId};\n`;
        }
      }
    });

    return mermaid;
  }

  public generateMermaidGraphDefinition(): string {
    return this.generateMermaidGraph();
  }
}

export const visualizeToolCallDependencyGraphMermaid = (context: GraphContext): string => {
  const visualizer = new ToolCallDependencyGraphVisualizer(context);
  return visualizer.generateMermaidGraphDefinition();
};