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

export interface DependencyContext {
  messageHistory: Message[];
  toolCallDependencies: {
    sourceId: string;
    targetId: string;
    dependencyType: "temporal" | "resource" | "capability" | "standard";
    reason: string;
  }[];
  resourceUsage: Record<string, {
    required: string;
    durationMs: number;
  }>;
}

export interface ToolCallNode {
  id: string;
  name: string;
  input: Record<string, unknown>;
  dependencies: string[];
}

export interface DependencyGraphData {
  nodes: ToolCallNode[];
  edges: {
    source: string;
    target: string;
    dependencyType: "temporal" | "resource" | "capability" | "standard";
    reason: string;
  }[];
}

export class ContextualToolCallDependencyGraphVisualizer {
  private context: DependencyContext;

  constructor(context: DependencyContext) {
    this.context = context;
  }

  private buildNodes(): ToolCallNode[] {
    const toolCallNodes: ToolCallNode[] = [];
    const toolUseIds = new Set<string>();

    this.context.messageHistory.forEach((message, index) => {
      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        assistantMessage.content.filter(
          (block): block is ToolUseBlock => block.type === "tool_use"
        ).forEach((block, toolIndex) => {
          const nodeId = `${index}-${toolIndex}`;
          toolUseIds.add(nodeId);
          toolCallNodes.push({
            id: nodeId,
            name: block.name,
            input: block.input,
            dependencies: [],
          });
        });
      }
    });

    return toolCallNodes;
  }

  private buildEdges(): {
    source: string;
    target: string;
    dependencyType: "temporal" | "resource" | "capability" | "standard";
    reason: string;
  }[] {
    return this.context.toolCallDependencies;
  }

  public buildGraphData(): DependencyGraphData {
    const nodes = this.buildNodes();
    const edges = this.buildEdges();

    // In a real implementation, we would enrich nodes with dependency info from edges.
    // For this structure, we keep it simple by just returning the collected data.

    return {
      nodes: nodes,
      edges: edges,
    };
  }

  public visualize(): void {
    const graphData = this.buildGraphData();
    console.log("--- Dependency Graph Data Generated ---");
    console.log("Nodes:", graphData.nodes);
    console.log("Edges:", graphData.edges);
    // Placeholder for actual rendering logic (e.g., calling a D3/React component)
    console.log("Visualization rendering initiated using graph data.");
  }
}