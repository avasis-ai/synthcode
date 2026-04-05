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

export interface DependencyEdge {
  from: string;
  to: string;
  type: "prerequisite" | "conditional";
  condition?: string;
  elsePath?: string;
}

export interface GraphNode {
  id: string;
  message: Message;
}

export interface ToolCallDependencyGraph {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

export interface VisualizerOptions {
  enableConditionalVisualization?: boolean;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV132Enhanced {
  private options: VisualizerOptions;

  constructor(options: VisualizerOptions = {}) {
    this.options = {
      enableConditionalVisualization: true,
      ...options,
    };
  }

  private getNodeLabel(node: GraphNode): string {
    const msg = node.message;
    if (msg.role === "user") {
      return `User: ${msg.content.substring(0, 30)}...`;
    }
    if (msg.role === "assistant") {
      const textBlocks = (msg.content as ContentBlock[]).filter(
        (block) => block.type === "text"
      );
      if (textBlocks.length > 0) {
        return `Assistant: ${textBlocks[0].text.substring(0, 30)}...`;
      }
      return "Assistant Response";
    }
    if (msg.role === "tool") {
      return `Tool Result (${msg.tool_use_id})`;
    }
    return "Unknown Node";
  }

  private generateMermaidGraph(graph: ToolCallDependencyGraph): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes
    const nodeMap = new Map<string, string>();
    graph.nodes.forEach((node, index) => {
      const nodeId = `N${index}`;
      const label = this.getNodeLabel(node);
      mermaid += `  ${nodeId}["${label}"]\n`;
      nodeMap.set(node.id, nodeId);
    });

    // 2. Define Edges
    graph.edges.forEach((edge, index) => {
      const fromId = nodeMap.get(edge.from);
      const toId = nodeMap.get(edge.to);

      if (!fromId || !toId) {
        return;
      }

      if (edge.type === "prerequisite") {
        mermaid += `  ${fromId} --> ${toId} : Prerequisite\n`;
      } else if (edge.type === "conditional") {
        if (!this.options.enableConditionalVisualization) {
          mermaid += `  ${fromId} --> ${toId} : Conditional\n`;
          return;
        }

        // Advanced Conditional Visualization Logic
        const conditionLabel = edge.condition || "Condition";
        const elseLabel = edge.elsePath ? `Else (${edge.elsePath})` : "Else";

        // Path 1: Condition
        mermaid += `  ${fromId} -->|${conditionLabel}| ${toId} : Condition\n`;

        // Path 2: Else (if specified)
        if (edge.elsePath) {
          const elseTargetId = nodeMap.get(edge.elsePath);
          if (elseTargetId) {
            mermaid += `  ${fromId} -->|${elseLabel}| ${elseTargetId} : Else\n`;
          }
        }
      }
    });

    return mermaid;
  }

  public visualize(graph: ToolCallDependencyGraph): string {
    return this.generateMermaidGraph(graph);
  }
}