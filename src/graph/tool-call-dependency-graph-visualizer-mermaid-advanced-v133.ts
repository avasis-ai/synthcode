import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

interface AdvancedVisualizerOptions {
  title: string;
  graphType: "graph TD" | "graph LR";
  defaultNodeStyle?: string;
  criticalPathEdgeStyle?: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV133 {
  private options: AdvancedVisualizerOptions;

  constructor(options: AdvancedVisualizerOptions) {
    this.options = options;
  }

  private generateNodeId(message: Message, index: number): string {
    const rolePrefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    const contentHash = message.content ? message.content.substring(0, 5).replace(/[^a-zA-Z0-9]/g, '') : "N";
    return `${rolePrefix}-${contentHash}-${index}`;
  }

  private getNodeDefinition(nodeId: string, message: Message, index: number): string {
    let content = "";
    if (message.role === "user") {
      content = `User Input: "${message.content.substring(0, 30)}..."`;
    } else if (message.role === "assistant") {
      const toolUses = (message as any).content?.filter((block: ContentBlock) => block.type === "tool_use") as ToolUseBlock[];
      if (toolUses.length > 0) {
        content = `Assistant Response (Tools Used: ${toolUses.length})`;
      } else {
        content = `Assistant Text: "${(message as any).content?.[0]?.text?.text?.substring(0, 30) || 'No text content'}:..."`;
      }
    } else if (message.role === "tool") {
      const error = (message as any).is_error ? "ERROR" : "Success";
      content = `Tool Result (${message.tool_use_id}): ${error}`;
    }

    const style = this.options.defaultNodeStyle || "style fill:#f9f,stroke:#333,stroke-width:2px";
    return `${nodeId}["${content}"] ${style}`;
  }

  private generateEdgeDefinition(sourceId: string, targetId: string, edgeType: string): string {
    let edgeSyntax = `${sourceId} --> ${targetId}`;
    let style = "";

    if (edgeType === "critical_path") {
      style = " style stroke:red,stroke-width:3px,stroke-dasharray: 5 5";
    } else if (edgeType === "dependency") {
      style = " style stroke:blue,stroke-width:2px";
    }

    return `${edgeSyntax}${style}`;
  }

  public renderGraph(messages: Message[], advancedEdges: { source: string; target: string; type: "critical_path" | "dependency" }[]): string {
    let mermaidCode = `graph ${this.options.graphType} "${this.options.title}"\n`;
    let nodeDeclarations: string[] = [];
    let edgeDeclarations: string[] = [];

    // 1. Generate Nodes
    messages.forEach((message, index) => {
      const nodeId = this.generateNodeId(message, index);
      nodeDeclarations.push(this.getNodeDefinition(nodeId, message, index));
    });

    // 2. Generate Edges (Dependencies)
    // Simple sequential dependency for demonstration
    for (let i = 0; i < messages.length - 1; i++) {
      const sourceId = this.generateNodeId(messages[i], i);
      const targetId = this.generateNodeId(messages[i + 1], i + 1);
      edgeDeclarations.push(this.generateEdgeDefinition(sourceId, targetId, "dependency"));
    }

    // 3. Incorporate Advanced Edges
    advancedEdges.forEach(edge => {
      const sourceId = edge.source;
      const targetId = edge.target;
      const edgeType = edge.type;
      edgeDeclarations.push(this.generateEdgeDefinition(sourceId, targetId, edgeType));
    });

    // Combine all parts
    mermaidCode += nodeDeclarations.join('\n') + '\n';
    mermaidCode += edgeDeclarations.join('\n');

    return mermaidCode;
  }
}