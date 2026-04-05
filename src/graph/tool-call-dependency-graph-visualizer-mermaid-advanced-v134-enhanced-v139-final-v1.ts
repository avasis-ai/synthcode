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

interface RendererStrategy {
  renderNode: (id: string, label: string, type: string, metadata: Record<string, unknown>) => string;
  renderEdge: (fromId: string, toId: string, label: string) => string;
  getGraphType: () => string;
}

abstract class BaseGraphVisualizer {
  protected renderer: RendererStrategy;

  constructor(renderer: RendererStrategy) {
    this.renderer = renderer;
  }

  abstract processGraph(messages: Message[]): string;

  protected generateMermaidGraph(graphDefinition: {
    nodes: { id: string; label: string; type: string; metadata: Record<string, unknown> }[];
    edges: { fromId: string; toId: string; label: string }[];
  }): string {
    const graphType = this.renderer.getGraphType();
    let mermaid = `graph ${graphType} {\n`;

    const nodeDeclarations: string[] = graphDefinition.nodes.map(node =>
      this.renderer.renderNode(node.id, node.label, node.type, node.metadata)
    );
    mermaid += nodeDeclarations.join('\n') + '\n';

    const edgeDeclarations: string[] = graphDefinition.edges.map(edge =>
      this.renderer.renderEdge(edge.fromId, edge.toId, edge.label)
    );
    mermaid += edgeDeclarations.join('\n');

    mermaid += '\n}';
    return mermaid;
  }
}

class ToolCallDependencyGraphVisualizerMermaidAdvancedV1 implements BaseGraphVisualizer {
  constructor(renderer: RendererStrategy) {
    super(renderer);
  }

  processGraph(messages: Message[]): string {
    const nodes: { id: string; label: string; type: string; metadata: Record<string, unknown> }[] = [];
    const edges: { fromId: string; toId: string; label: string }[] = [];
    let currentIdCounter = 1;

    const processMessage = (message: Message, index: number) => {
      const messageId = `msg_${index}`;
      let nodeLabel = `Message ${index}`;
      let nodeType = "message";
      let metadata: Record<string, unknown> = { role: message.role };

      if (message.role === "user") {
        nodeLabel = `User Input`;
        nodeType = "user";
        metadata.content = (message as UserMessage).content;
      } else if (message.role === "assistant") {
        nodeLabel = `Assistant Response`;
        nodeType = "assistant";
        metadata.contentBlocks = (message as AssistantMessage).content;
      } else if (message.role === "tool") {
        const toolMessage = message as ToolResultMessage;
        nodeLabel = `Tool Result (${toolMessage.tool_use_id})`;
        nodeType = "tool_result";
        metadata.isError = toolMessage.is_error;
        metadata.content = toolMessage.content;
      }

      nodes.push({
        id: messageId,
        label: nodeLabel,
        type: nodeType,
        metadata: metadata,
      });

      // Simplified edge generation: Connect sequentially for demonstration
      if (index > 0) {
        const previousMessage = messages[index - 1];
        const previousId = `msg_${index - 1}`;
        edges.push({
          fromId: previousId,
          toId: messageId,
          label: "Follows",
        });
      }
    };

    messages.forEach((message, index) => processMessage(message, index));

    // Advanced logic placeholder: Detect tool calls and link them specifically
    const toolUseNodes: { id: string; label: string; type: string; metadata: Record<string, unknown> }[] = [];
    const toolUseEdges: { fromId: string; toId: string; label: string }[] = [];

    messages.forEach((message, index) => {
      if (message.role === "assistant" && (message as AssistantMessage).content.some(
        (block) => (block as ToolUseBlock).type === "tool_use"
      )) {
        const toolUseBlocks = (message as AssistantMessage).content.filter(
          (block) => (block as ToolUseBlock).type === "tool_use"
        ) as ToolUseBlock[];

        toolUseBlocks.forEach((toolUse, toolIndex) => {
          const toolUseId = `tool_use_${index}_${toolIndex}`;
          toolUseNodes.push({
            id: toolUseId,
            label: `${toolUse.name} (${toolUse.id})`,
            type: "tool_call",
            metadata: { tool_name: toolUse.name, tool_id: toolUse.id },
          });

          // Link from the main message node to the specific tool call node
          toolUseEdges.push({
            fromId: `msg_${index}`,
            toId: toolUseId,
            label: "Calls Tool",
          });
        });
      }
    });

    // Combine all nodes and edges for final rendering
    const allNodes = [...nodes, ...toolUseNodes];
    const allEdges = [...edges, ...toolUseEdges];

    return this.generateMermaidGraph({ nodes: allNodes, edges: allEdges });
  }
}

export function createToolCallDependencyGraphVisualizer(renderer: RendererStrategy): ToolCallDependencyGraphVisualizerMermaidAdvancedV1 {
  return new ToolCallDependencyGraphVisualizerMermaidAdvancedV1(renderer);
}