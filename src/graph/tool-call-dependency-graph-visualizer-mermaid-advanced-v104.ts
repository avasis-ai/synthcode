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
  type: "user" | "assistant" | "tool";
  content: any;
}

interface DependencyEdge {
  from: string;
  to: string;
  condition?: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV104 {
  private nodes: GraphNode[] = [];
  private edges: DependencyEdge[] = [];

  constructor() {}

  public addNode(node: GraphNode): void {
    this.nodes.push(node);
  }

  public addEdge(from: string, to: string, condition?: string): void {
    this.edges.push({ from, to, condition });
  }

  private getNodeLabel(node: GraphNode): string {
    switch (node.type) {
      case "user":
        return `User: ${node.content.text.substring(0, 30)}...`;
      case "assistant":
        const assistantContent = node.content as AssistantMessage;
        const textBlocks = (assistantContent.content as ContentBlock[]).filter(
          (block) => (block as TextBlock).type === "text"
        );
        if (textBlocks.length > 0) {
          return `Assistant: ${textBlocks[0].text.substring(0, 30)}...`;
        }
        return "Assistant: Content Block";
      case "tool":
        const toolResult = node.content as ToolResultMessage;
        return `Tool (${toolResult.tool_use_id}): ${
          toolResult.is_error ? "ERROR" : "Success"
        }`;
      default:
        return "Unknown Node";
    }
  }

  private generateMermaidGraph(): string {
    let mermaid = "graph TD;\n";

    // 1. Define Nodes
    const nodeDefinitions: string[] = this.nodes.map((node, index) => {
      const id = `N${index}`;
      const label = this.getNodeLabel(node);
      return `${id}["${label}"]`;
    });
    mermaid += nodeDefinitions.join("\n") + "\n";

    // 2. Define Edges (Handling Conditionals)
    const edgeDefinitions: string[] = this.edges.map((edge, index) => {
      let definition = `${edge.from} --> ${edge.to}`;
      if (edge.condition) {
        // Using Mermaid's ability to define conditional links or subgraphs for clarity
        // For simplicity in pure Mermaid syntax, we use descriptive labels on the edge.
        definition = `${edge.from} -- "${edge.condition}" --> ${edge.to}`;
      }
      return definition;
    });
    mermaid += edgeDefinitions.join("\n") + "\n";

    // 3. Adding structure for complex flow visualization (Subgraph for conditional logic)
    // This simulates the advanced requirement by grouping related conditional paths.
    let subgraphMermaid = "";
    const conditionalEdges = this.edges.filter(e => e.condition);

    if (conditionalEdges.length > 0) {
      subgraphMermaid = "\n%% Conditional Flow Visualization\n";
      subgraphMermaid += "subgraph Conditional Paths\n";
      const uniqueSources = new Set(conditionalEdges.map(e => e.from));
      const uniqueTargets = new Set(conditionalEdges.map(e => e.to));

      // Grouping by source node for better visual structure
      uniqueSources.forEach(sourceId => {
        const outgoingConditions = conditionalEdges.filter(e => e.from === sourceId);
        if (outgoingConditions.length > 0) {
          subgraphMermaid += `  ${sourceId} -->|Conditional Branching| {`;
          const branches = outgoingConditions.map(e => {
            return `${e.to} -- "${e.condition}" -->`;
          }).join(" | ");
          subgraphMermaid += `${branches}\n`;
          subgraphMermaid += `  }\n`;
        }
      });
      subgraphMermaid += "end\n";
    }

    return mermaid + subgraphMermaid;
  }

  public visualizeMermaid(mermaidDiagram: string): string {
    return this.generateMermaidGraph();
  }
}