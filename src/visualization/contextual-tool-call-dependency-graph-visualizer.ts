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

export interface DependencyLink {
  callerId: string;
  calleeId: string;
  dependencyType: "output_to_input";
  sourceKey: string;
  targetKey: string;
}

export interface ToolCallGraph {
  nodes: Record<string, { name: string; description: string }>;
  edges: DependencyLink[];
}

export class ContextualToolCallDependencyGraphVisualizer {
  private history: Message[];

  constructor(history: Message[]) {
    this.history = history;
  }

  private extractToolCallDependencies(): DependencyLink[] {
    const dependencies: DependencyLink[] = [];
    const toolCalls: {
      id: string;
      name: string;
      input: Record<string, unknown>;
      messageIndex: number;
    }[] = [];

    let currentToolCallIndex = 0;

    for (let i = 0; i < this.history.length; i++) {
      const message = this.history[i];

      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            const toolCall = {
              id: toolUseBlock.id,
              name: toolUseBlock.name,
              input: toolUseBlock.input,
              messageIndex: i,
            };
            toolCalls.push(toolCall);
          }
        }
      }
    }

    // Simple sequential dependency detection: ToolCall[i] -> ToolCall[i+1]
    // In a real scenario, we'd need to map tool output keys to subsequent tool inputs.
    // For this implementation, we simulate dependency detection based on sequential calls.
    for (let i = 0; i < toolCalls.length - 1; i++) {
      const caller = toolCalls[i];
      const callee = toolCalls[i + 1];

      // Simulate dependency: Assume the output of the previous tool call (caller)
      // provides input context for the next tool call (callee).
      dependencies.push({
        callerId: caller.id,
        calleeId: callee.id,
        dependencyType: "output_to_input",
        sourceKey: `output_from_${caller.name}`,
        targetKey: `input_for_${callee.name}`,
      });
    }

    return dependencies;
  }

  public generateGraph(): ToolCallGraph {
    const dependencies = this.extractToolCallDependencies();
    const nodes: Record<string, { name: string; description: string }> = {};

    // Populate nodes from tool calls
    const toolCalls: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    }[] = [];

    for (const message of this.history) {
      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            toolCalls.push({
              id: toolUseBlock.id,
              name: toolUseBlock.name,
              input: toolUseBlock.input,
            });
            nodes[toolUseBlock.id] = {
              name: toolUseBlock.name,
              description: `Tool Call ID: ${toolUseBlock.id}. Input: ${JSON.stringify(toolUseBlock.input)}`,
            };
          }
        }
      }
    }

    return {
      nodes: nodes,
      edges: dependencies,
    };
  }

  public visualize(graph: ToolCallGraph): void {
    console.log("--- Tool Call Dependency Graph Visualization ---");
    console.log("Nodes (Tools):", JSON.stringify(graph.nodes, null, 2));
    console.log("Edges (Dependencies):", JSON.stringify(graph.edges, null, 2));
    console.log("---------------------------------------------");
    // In a real implementation, this would render SVG/Canvas/React components.
  }
}