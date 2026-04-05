import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface AdvancedGraphOptions extends GraphOptions {
  nodeStyles?: Record<string, { shape: string; style: string }>;
  edgeTypes?: Record<string, { label: string; class: string }>;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV33 {
  private options: AdvancedGraphOptions;

  constructor(options: AdvancedGraphOptions) {
    this.options = options;
  }

  private generateNodes(messages: Message[]): string[] {
    const nodes: string[] = [];
    const nodeMap = new Map<string, string>();

    messages.forEach((message, index) => {
      if (message.role === "user") {
        const nodeId = `user_${index}`;
        nodes.push(`${nodeId}["User Input ${index + 1}"]`);
        nodeMap.set(nodeId, `User Input ${index + 1}`);
      } else if (message.role === "assistant") {
        const nodeId = `assistant_${index}`;
        nodes.push(`${nodeId}["Assistant Response ${index + 1}"]`);
        nodeMap.set(nodeId, `Assistant Response ${index + 1}`);
      } else if (message.role === "tool") {
        const nodeId = `tool_${message.tool_use_id}`;
        nodes.push(`${nodeId}["Tool Result: ${message.tool_use_id}"]`);
        nodeMap.set(nodeId, `Tool Result: ${message.tool_use_id}`);
      }
    });
    return nodes;
  }

  private generateEdges(messages: Message[]): string[] {
    const edges: string[] = [];
    for (let i = 0; i < messages.length - 1; i++) {
      const currentMessage = messages[i];
      const nextMessage = messages[i + 1];

      let sourceId: string;
      let targetId: string;

      if (currentMessage.role === "user") {
        sourceId = `user_${i}`;
      } else if (currentMessage.role === "assistant") {
        sourceId = `assistant_${i}`;
      } else {
        sourceId = `tool_${currentMessage.tool_use_id}`;
      }

      if (nextMessage.role === "user") {
        targetId = `user_${i + 1}`;
      } else if (nextMessage.role === "assistant") {
        targetId = `assistant_${i + 1}`;
      } else {
        targetId = `tool_${nextMessage.tool_use_id}`;
      }

      edges.push(`${sourceId} -->|${this.options.edgeTypes?.default?.label || "Continues"} ${targetId}`);
    }
    return edges;
  }

  public renderMermaid(messages: Message[]): string {
    const nodes = this.generateNodes(messages);
    const edges = this.generateEdges(messages);

    let mermaidCode = "graph TD;\n";

    // Apply node styles
    const nodeStyles = this.options.nodeStyles || {};
    nodes.forEach(nodeDef => {
      // Simple heuristic to determine node type for styling
      let nodeId = nodeDef.match(/(\w+)_(\d+|[a-zA-Z0-9]+)/)?.[1] || 'default';
      let styleKey = nodeId.includes('user') ? 'user' : nodeId.includes('assistant') ? 'assistant' : 'tool';
      
      if (nodeStyles[styleKey]) {
        mermaidCode += `${nodeDef}:::${styleKey};\n`;
      } else {
        mermaidCode += `${nodeDef};\n`;
      }
    });

    // Apply edge styles (simplified for this advanced version)
    const edgeStyles = this.options.edgeTypes || {};
    if (edgeStyles.default) {
        mermaidCode += `linkStyle 0 stroke-width:2px,stroke:#333;\n`;
    }

    // Add edges
    mermaidCode += edges.join('\n') + "\n";

    return mermaidCode;
  }
}