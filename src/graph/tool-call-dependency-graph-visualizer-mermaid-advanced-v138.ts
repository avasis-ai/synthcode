import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface DependencyNode {
  id: string;
  type: "user" | "assistant" | "tool";
  content: any;
  metadata: Record<string, unknown>;
}

export interface DependencyEdge {
  fromId: string;
  toId: string;
  condition?: string;
  dataFlow?: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV138 {
  private nodes: DependencyNode[];
  private edges: DependencyEdge[];

  constructor(nodes: DependencyNode[], edges: DependencyEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private getNodeDefinition(node: DependencyNode): string {
    let contentString = "";
    switch (node.type) {
      case "user":
        contentString = `User Input: "${(node.content as TextBlock).text.substring(0, 30)}..."`;
        break;
      case "assistant":
        const assistantContent = node.content as any;
        if (Array.isArray(assistantContent)) {
          const textBlocks = assistantContent.filter((block: ContentBlock) => block.type === "text") as TextBlock[];
          if (textBlocks.length > 0) {
            contentString = `Assistant Response: "${textBlocks[0].text.substring(0, 30)}..."`;
          } else {
            contentString = "Assistant Response (Complex)";
          }
        } else {
          contentString = "Assistant Response (Unknown)";
        }
        break;
      case "tool":
        const toolResult = node.content as any;
        if (toolResult.tool_use_id) {
          contentString = `Tool Result (${toolResult.tool_use_id}): ${toolResult.content.substring(0, 30)}...`;
        } else {
          contentString = "Tool Execution";
        }
        break;
    }
    return `${node.id}["${contentString}"]`;
  }

  private getEdgeDefinition(edge: DependencyEdge): string {
    let definition = `${edge.fromId} --> ${edge.toId}`;
    if (edge.condition) {
      definition += `|${edge.condition}|`;
    } else if (edge.dataFlow) {
      definition += `{{Data: ${edge.dataFlow}}}`;
    }
    return definition;
  }

  public generateMermaidGraph(): string {
    let graphDefinition = "graph TD;\n";

    // 1. Define Nodes
    const nodeDefinitions = this.nodes.map(this.getNodeDefinition).join('\n    ');
    graphDefinition += `    ${nodeDefinitions};\n\n`;

    // 2. Define Edges
    const edgeDefinitions = this.edges.map(this.getEdgeDefinition).join('\n    ');
    graphDefinition += `    ${edgeDefinitions};\n`;

    return `%% Tool Call Dependency Graph\n${graphDefinition}`;
  }
}