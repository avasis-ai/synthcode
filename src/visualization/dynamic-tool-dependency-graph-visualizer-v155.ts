import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type CausalLink = {
  sourceToolId: string;
  targetToolId: string;
  causalConstraint: string;
  temporalInfluence: number; // e.g., time delta or sequence index
};

export interface DependencyGraphPayload {
  messages: Message[];
  causalLinks: CausalLink[];
}

export class DynamicToolDependencyGraphVisualizer {
  private payload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.payload = payload;
  }

  private extractToolCalls(messages: Message[]): Map<string, { block: ToolUseBlock, messageIndex: number }> {
    const toolCalls = new Map<string, { block: ToolUseBlock, messageIndex: number }>();
    messages.forEach((message, index) => {
      if (message.role === "assistant") {
        const blocks = (message as any).content || []; // Assuming content is available on AssistantMessage
        blocks.filter((block: ContentBlock) => block.type === "tool_use")
              .forEach((block: ToolUseBlock) => {
                toolCalls.set(block.id, { block, messageIndex: index });
              });
      }
    });
    return toolCalls;
  }

  private buildGraphStructure(toolCalls: Map<string, { block: ToolUseBlock, messageIndex: number }>): { nodes: Record<string, any>; edges: any[] } {
    const nodes: Record<string, any> = {};
    const edges: any[] = [];

    toolCalls.forEach((data, toolId) => {
      nodes[toolId] = {
        id: toolId,
        label: `${data.block.name} (${toolId.substring(0, 4)}...)`,
        type: "tool_call",
        position: { x: Math.random() * 100, y: Math.random() * 100 }, // Placeholder positioning
        metadata: {
          callBlock: data.block,
          messageIndex: data.messageIndex,
        }
      };
    });

    this.payload.causalLinks.forEach((link, index) => {
      const sourceNode = nodes[link.sourceToolId];
      const targetNode = nodes[link.targetToolId];

      if (sourceNode && targetNode) {
        edges.push({
          source: link.sourceToolId,
          target: link.targetToolId,
          value: 1,
          label: `Causal Link: ${link.causalConstraint}`,
          type: "causal",
          metadata: {
            temporalInfluence: link.temporalInfluence,
            linkIndex: index,
          }
        });
      }
    });

    return { nodes, edges };
  }

  public visualize(): { nodes: Record<string, any>; edges: any[] } {
    const toolCalls = this.extractToolCalls(this.payload.messages);
    const graph = this.buildGraphStructure(toolCalls);

    // In a real implementation, this would return structured data for a rendering library (e.g., D3, Cytoscape)
    return graph;
  }
}