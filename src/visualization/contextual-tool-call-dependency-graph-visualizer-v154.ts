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

export interface DependencyMetadata {
  sourceCallId: string;
  targetCallId: string;
  dependencyType: "standard" | "requires_resource" | "must_precede_due_to_time" | "capability_constraint";
  metadata: Record<string, unknown>;
}

export interface ToolCallDependencyGraph {
  nodes: Record<string, {
    id: string;
    name: string;
    type: "tool_call" | "user_input" | "assistant_thought";
    metadata: Record<string, unknown>;
  }>;
  edges: DependencyMetadata[];
}

export class ContextualToolCallDependencyGraphVisualizer {
  private graph: ToolCallDependencyGraph;

  constructor() {
    this.graph = {
      nodes: {},
      edges: [],
    };
  }

  public buildGraph(
    messages: Message[],
    dependencies: DependencyMetadata[]
  ): ToolCallDependencyGraph {
    const nodes: Record<string, {
      id: string;
      name: string;
      type: "tool_call" | "user_input" | "assistant_thought";
      metadata: Record<string, unknown>;
    } = {};
    const edges: DependencyMetadata[] = [];

    // 1. Process Messages to build Nodes
    messages.forEach((message, index) => {
      if (message.role === "user") {
        const nodeId = `user_${index}`;
        nodes[nodeId] = {
          id: nodeId,
          name: "User Input",
          type: "user_input",
          metadata: { content: message.content },
        };
      } else if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        // Simplified: Treat the entire assistant message as one conceptual unit for visualization
        const nodeId = `assistant_${index}`;
        nodes[nodeId] = {
          id: nodeId,
          name: "Assistant Reasoning",
          type: "assistant_thought",
          metadata: { contentBlocks: assistantMessage.content },
        };
      } else if (message.role === "tool") {
        const toolMessage = message as ToolResultMessage;
        // In a real scenario, we'd map tool_use_id to a specific call node.
        // Here, we use the message index as a proxy for the tool result node.
        const nodeId = `tool_result_${index}`;
        nodes[nodeId] = {
          id: nodeId,
          name: `Tool Result (${toolMessage.tool_use_id})`,
          type: "tool_call",
          metadata: { result: toolMessage.content, isError: toolMessage.is_error ?? false },
        };
      }
    });

    // 2. Aggregate Dependencies
    edges.push(...dependencies);

    this.graph = {
      nodes: nodes,
      edges: edges,
    };
    return this.graph;
  }

  public getGraph(): ToolCallDependencyGraph {
    return this.graph;
  }

  public renderGraph(
    graphData: ToolCallDependencyGraph,
    renderer: (data: ToolCallDependencyGraph) => void
  ): void {
    renderer(graphData);
  }
}

export {
  ContextualToolCallDependencyGraphVisualizer,
  DependencyMetadata,
  ToolCallDependencyGraph,
};