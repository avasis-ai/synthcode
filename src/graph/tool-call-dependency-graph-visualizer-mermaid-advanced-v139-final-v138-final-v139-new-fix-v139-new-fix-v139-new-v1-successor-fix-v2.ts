import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface GraphNode {
  id: string;
  type: "user" | "assistant" | "tool";
  content: ContentBlock[];
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  from: string;
  to: string;
  condition?: string;
  isLoop?: boolean;
  label?: string;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class MermaidGraphVisualizer {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private getNodeMermaidId(node: GraphNode): string {
    const baseId = node.id.replace(/[^a-zA-Z0-9]/g, "_");
    return `${baseId}_node`;
  }

  private getToolCallMermaidId(node: GraphNode): string {
    const toolUse = node.content.find((block): block is ToolUseBlock => block.type === "tool_use") as ToolUseBlock | undefined;
    if (!toolUse) return "";
    return `tool_${toolUse.id.replace(/[^a-zA-Z0-9]/g, "_")}`;
  }

  private renderNode(node: GraphNode): string {
    let contentHtml = "";
    for (const block of node.content) {
      if (block.type === "text") {
        contentHtml += `Text: ${block.text.substring(0, 50)}...`;
      } else if (block.type === "tool_use") {
        contentHtml += `Tool Call: ${block.name}(${JSON.stringify(block.input)})`;
      } else if (block.type === "thinking") {
        contentHtml += `Thinking: ${block.thinking.substring(0, 50)}...`;
      }
    }

    const nodeId = this.getNodeMermaidId(node);
    return `${nodeId}["${node.type.toUpperCase()}: ${contentHtml}"]`;
  }

  private renderEdge(edge: GraphEdge): string {
    let mermaidSyntax = `${this.getNodeMermaidId(this.graph.nodes.find(n => n.id === edge.from)!)} --> ${this.getNodeMermaidId(this.graph.nodes.find(n => n.id === edge.to)!)}`
    
    if (edge.condition) {
      mermaidSyntax += `{${edge.condition}}`;
    } else if (edge.label) {
      mermaidSyntax += `("${edge.label}")`;
    }

    if (edge.isLoop) {
      return `loop_${edge.from} --> ${edge.to} {${edge.label || ""}}`;
    }

    return mermaidSyntax;
  }

  private renderConditionalFlow(edges: GraphEdge[]): string {
    let conditionalMermaid = "";
    const conditionalEdges = edges.filter(e => e.condition);

    if (conditionalEdges.length === 0) return "";

    let startNodeId = this.getNodeMermaidId(this.graph.nodes.find(n => n.id === conditionalEdges[0].from)!);
    let endNodeId = this.getNodeMermaidId(this.graph.nodes.find(n => n.id === conditionalEdges[0].to)!);

    conditionalMermaid += `graph TD\n`;
    conditionalMermaid += `    ${startNodeId} -->|if ${conditionalEdges[0].condition}| StartCondition; \n`;
    conditionalMermaid += `    StartCondition{Condition Check}\n`;
    
    // Simplified handling for IF/ELSE structure visualization
    let currentSource = startNodeId;
    let currentTarget = endNodeId;

    for (let i = 0; i < conditionalEdges.length; i++) {
        const edge = conditionalEdges[i];
        if (i === 0) {
            conditionalMermaid += `    ${startNodeId} -->|${edge.condition}| ${this.getNodeMermaidId(this.graph.nodes.find(n => n.id === edge.to)!)};\n`;
        } else {
            // Subsequent conditions are assumed to branch from the previous target or a central point
            conditionalMermaid += `    ${this.getNodeMermaidId(this.graph.nodes.find(n => n.id === edge.from)!)} -->|${edge.condition}| ${this.getNodeMermaidId(this.graph.nodes.find(n => n.id === edge.to)!)};\n`;
        }
    }
    return conditionalMermaid;
  }

  private renderLoopFlow(edges: GraphEdge[]): string {
    let loopMermaid = "";
    const loopEdges = edges.filter(e => e.isLoop);

    if (loopEdges.length === 0) return "";

    loopMermaid += "graph TD\n";
    loopEdges.forEach(edge => {
        const startId = this.getNodeMermaidId(this.graph.nodes.find(n => n.id === edge.from)!);
        const endId = this.getNodeMermaidId(this.graph.nodes.find(n => n.id === edge.to)!);
        loopMermaid += `    ${startId} -- ${edge.label || "Loop"} --> ${endId} \n`;
    });
    return loopMermaid;
  }

  public generateMermaidGraph(): string {
    let mermaidCode = "graph TD\n";

    // 1. Render Nodes
    const nodeDeclarations = this.graph.nodes.map(this.renderNode).join('\n');
    mermaidCode += nodeDeclarations + "\n\n";

    // 2. Render Standard Edges
    const standardEdges = this.graph.edges.filter(e => !e.condition && !e.isLoop);
    const edgeDeclarations = standardEdges.map(e => this.renderEdge(e)).join('\n');
    mermaidCode += "subgraph Standard Flow\n" + edgeDeclarations + "\nend\n\n";

    // 3. Render Conditional Logic (IF/ELSE)
    const conditionalMermaid = this.renderConditionalFlow(this.graph.edges);
    if (conditionalMermaid) {
        mermaidCode += "\n/* --- Conditional Logic --- */\n" + conditionalMermaid;
    }

    // 4. Render Loops
    const loopMermaid = this.renderLoopFlow(this.graph.edges);
    if (loopMermaid) {
        mermaidCode += "\n/* --- Loop Structures --- */\n" + loopMermaid;
    }

    return mermaidCode;
  }
}