import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export type MermaidGraph = {
  graphDefinition: string;
  nodes: string[];
  edges: string[];
};

export class ToolCallDependencyGraphVisualizerMermaid {
  private messages: Message[];

  constructor(messages: Message[]) {
    this.messages = messages;
  }

  private extractToolCalls(message: Message): { toolUseId: string; toolName: string; input: Record<string, unknown> }[] {
    const toolUseBlocks: ToolUseBlock[] = (message as AssistantMessage).content.filter(
      (block): block is ToolUseBlock => block.type === "tool_use"
    );

    return toolUseBlocks.map((block) => ({
      toolUseId: block.id,
      toolName: block.name,
      input: block.input,
    }));
  }

  private getToolCallGraph(message: Message): { toolUseId: string; toolName: string; input: Record<string, unknown> }[] {
    if (message.role !== "assistant") {
      return [];
    }
    return this.extractToolCalls(message);
  }

  public visualize(
    source: Message | null,
    target: Message | null
  ): MermaidGraph {
    const nodes: string[] = [];
    const edges: string[] = [];
    const graphDefinition: string[] = ["graph TD"];

    if (!source || !target) {
      return { graphDefinition: "graph TD; A --> B;", nodes: [], edges: [] };
    }

    const sourceToolCalls = this.getToolCallGraph(source);
    const targetToolCalls = this.getToolCallGraph(target);

    const uniqueToolUseIds = new Set<string>();

    // 1. Process Source Tool Calls (Source -> Tool Call)
    sourceToolCalls.forEach((call, index) => {
      const sourceNodeId = `Source_${source.role}_${index}`;
      const toolCallNodeId = `ToolCall_${call.toolUseId}`;

      nodes.push(sourceNodeId);
      nodes.push(toolCallNodeId);
      edges.push(`${sourceNodeId} --> ${toolCallNodeId} [Calls ${call.toolName}]`);
      uniqueToolUseIds.add(call.toolUseId);
    });

    // 2. Process Target Tool Calls (Tool Call -> Target)
    targetToolCalls.forEach((call, index) => {
      const targetNodeId = `Target_${target.role}_${index}`;
      const toolCallNodeId = `ToolCall_${call.toolUseId}`;

      nodes.push(targetNodeId);
      nodes.push(toolCallNodeId);
      edges.push(`${toolCallNodeId} --> ${targetNodeId} [Result for ${call.toolName}]`);
      uniqueToolUseIds.add(call.toolUseId);
    });

    // 3. Handle Tool Result Nodes (If tool result is present, it connects the flow)
    // This simplified version assumes the flow is Source -> ToolCall -> Target
    // A more complex graph would need to map tool results back to the next step.

    // For simplicity in this Mermaid visualization, we focus on the direct dependency chain:
    // Source -> ToolCall -> Target
    
    return {
      graphDefinition: "graph TD",
      nodes: Array.from(new Set([...nodes, ...Array.from(uniqueToolUseIds).map(id => `Tool_${id}`)]))
        .map(id => `id["${id}"]`),
      edges: edges,
    };
  }
}