import { DependencyGraph, Message, ContentBlock, ToolUseBlock } from "./dependency-graph-types";

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV0 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private getNodeLabel(node: DependencyGraph.Node): string {
    if (node.type === "user") {
      return `User Input`;
    }
    if (node.type === "assistant") {
      return `Assistant Response`;
    }
    if (node.type === "tool_result") {
      return `Tool Result`;
    }
    return "Unknown Step";
  }

  private getToolCallNodeId(toolUse: ToolUseBlock): string {
    return `tool_${toolUse.id}`;
  }

  private renderNode(node: DependencyGraph.Node): string {
    const id = `${node.type}_${Math.random().toString(36).substring(2, 9)}`;
    let label = this.getNodeLabel(node);

    if (node.type === "tool_use") {
      const toolUse = node as { type: "tool_use", tool_use_block: ToolUseBlock };
      label = `Tool Call: ${toolUse.tool_use_block.name}`;
    }

    return `${id}["${label}"]`;
  }

  private renderEdge(sourceId: string, targetId: string): string {
    return `${sourceId} --> ${targetId}`;
  }

  public render(): string {
    const nodes: string[] = [];
    const edges: string[] = [];

    const nodesMap: Map<string, DependencyGraph.Node> = new Map();
    const toolCallToNodeIdMap: Map<string, string> = new Map();

    // 1. Process nodes and map tool calls
    for (const node of this.graph.nodes) {
      if (node.type === "tool_use") {
        const toolUse = node as { type: "tool_use", tool_use_block: ToolUseBlock };
        const nodeId = this.getToolCallNodeId(toolUse.tool_use_block);
        nodes.push(this.renderNode(node));
        toolCallToNodeIdMap.set(toolUse.tool_use_block.id, nodeId);
      } else {
        nodes.push(this.renderNode(node));
      }
    }

    // 2. Process edges (Simplified flow: sequential connections)
    for (let i = 0; i < this.graph.nodes.length - 1; i++) {
      const sourceNode = this.graph.nodes[i];
      const targetNode = this.graph.nodes[i + 1];

      let sourceId: string;
      let targetId: string;

      // Use the rendered IDs for connection
      sourceId = this.renderNode(sourceNode).match(/\[(.*?)\]/)[1] || "Start";
      targetId = this.renderNode(targetNode).match(/\[(.*?)\]/)[1] || "End";

      edges.push(this.renderEdge(sourceId, targetId));
    }

    const mermaidSyntax = `graph TD\n${nodes.join('\n')}\n\n${edges.join('\n')}`;
    return mermaidSyntax;
  }
}