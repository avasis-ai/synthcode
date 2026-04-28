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

interface GraphNode {
  id: string;
  label: string;
  type: "tool" | "context";
  metadata: Record<string, unknown>;
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

interface DependencyGraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

class ContextAnalyzer {
  private messages: Message[];

  constructor(messages: Message[]) {
    this.messages = messages;
  }

  analyze(): {
    inferredDependencies: DependencyGraphPayload;
    contextNodes: GraphNode[];
  } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>();

    const addNode = (id: string, label: string, type: "tool" | "context", metadata: Record<string, unknown> = {}): GraphNode => {
      if (!nodeMap.has(id)) {
        const node: GraphNode = { id, label, type, metadata };
        nodeMap.set(id, node);
        nodes.push(node);
      }
      return nodeMap.get(id)!;
    };

    const analyzeMessage = (message: Message, index: number): void => {
      if (message.role === "tool" && typeof message.content === 'string') {
        const toolResult = message as ToolResultMessage;
        const toolId = toolResult.tool_use_id;
        const node = addNode(toolId, `Tool Result: ${toolId}`, "tool", { result: toolResult.content });
        nodeMap.set(toolId, node);
      } else if (message.role === "assistant" && typeof message.content === 'object' && message.content !== null) {
        const assistantMessage = message as AssistantMessage;
        assistantMessage.content.forEach((block: ContentBlock | ToolUseBlock) => {
          if (block.type === "tool_use") {
            const toolUse = block as ToolUseBlock;
            const toolId = `${toolUse.name}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const node = addNode(toolId, `Tool Call: ${toolUse.name}`, "tool", { input: toolUse.input });
            nodeMap.set(toolId, node);
          }
        });
      }
    };

    this.messages.forEach((message, index) => {
      analyzeMessage(message, index);
    });

    // Simple inference: Assume sequential tool calls imply dependency
    for (let i = 0; i < this.messages.length - 1; i++) {
      const current = this.messages[i];
      const next = this.messages[i + 1];

      if (current.role === "tool" && next.role === "tool") {
        const sourceId = (current as ToolResultMessage).tool_use_id;
        const targetId = (next as ToolResultMessage).tool_use_id;
        edges.push({
          source: sourceId,
          target: targetId,
          relationship: "Sequential Execution",
          strength: 0.9,
        });
      }
    }

    return {
      inferredDependencies: { nodes: nodes, edges: edges },
      contextNodes: nodes.filter(n => n.type === "context")
    };
  }
}

export class DynamicToolDependencyGraphVisualizer {
  private payload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.payload = payload;
  }

  public renderGraph(): string {
    const nodeLabels = this.payload.nodes.map(node => `${node.id}: ${node.label}`).join('\n');
    const edgeDescriptions = this.payload.edges.map(edge => `${edge.source} --> ${edge.target} (${edge.relationship})`).join('\n');

    const mermaidGraph = `graph TD\n${this.payload.nodes.map(n => `${n.id}["${n.label}"]`).join('\n')}\n${this.payload.edges.map(e => `${e.source} -->|${e.relationship}| ${e.target}`).join('\n')}`;

    return `Visualization using Mermaid format:\n\n${mermaidGraph}`;
  }

  public getMetadata(): Record<string, any> {
    return {
      nodeCount: this.payload.nodes.length,
      edgeCount: this.payload.edges.length,
      description: "Dynamically inferred tool dependency graph."
    };
  }
}

export const createDynamicGraphVisualizer = (messages: Message[]): DynamicToolDependencyGraphVisualizer => {
  const analyzer = new ContextAnalyzer(messages);
  const { inferredDependencies } = analyzer.analyze();
  return new DynamicToolDependencyGraphVisualizer(inferredDependencies);
};