import { GraphContext, Node, Edge } from "./graph-context";

export interface ConditionalPath {
  condition: string;
  nextNodes: string[];
}

export interface LoopPath {
  loopCondition: string;
  exitNodes: string[];
}

export interface AdvancedGraphContext extends GraphContext {
  conditionalPaths?: Map<string, ConditionalPath>;
  loopPaths?: Map<string, LoopPath>;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV142 {
  private context: AdvancedGraphContext;

  constructor(context: AdvancedGraphContext) {
    this.context = context;
  }

  private mapNodeToMermaidId(node: Node): string {
    const nodeId = node.id;
    if (node.type === "tool_call") {
      return `T${node.id}`;
    }
    return `N${node.id}`;
  }

  private renderNodeMermaid(node: Node): string {
    const id = this.mapNodeToMermaidId(node);
    let definition = `    ${id}["${node.description}"];\n`;

    if (node.type === "tool_call") {
      const toolUse = node.toolUse;
      definition += `    ${id} -- Calls --> Tool(${toolUse.name}) [Input: ${JSON.stringify(toolUse.input)}];\n`;
    } else if (node.type === "conditional_branch") {
      definition += `    ${id}["Conditional Check: ${node.description}"];\n`;
    } else if (node.type === "loop_control") {
      definition += `    ${id}["Loop Control: ${node.description}"];\n`;
    } else {
      definition += `    ${id}["${node.description}"];\n`;
    }
    return definition;
  }

  private renderEdgesMermaid(edges: Edge[]): string {
    let mermaidEdges = "";
    for (const edge of edges) {
      const sourceId = this.mapNodeToMermaidId(edge.source);
      const targetId = this.mapNodeToMermaidId(edge.target);
      let label = edge.label || "";

      if (edge.source.type === "conditional_branch" && edge.target.type === "conditional_branch") {
        // Advanced handling for conditional flow visualization
        const condition = (edge.label as string)?.replace("Condition: ", "");
        mermaidEdges += `    ${sourceId} -- ${condition || "Flow"} --> ${targetId} [Condition: ${condition || "N/A"}];\n`;
      } else if (edge.source.type === "loop_control" && edge.target.type === "loop_control") {
        // Advanced handling for loop flow visualization
        const loopLabel = (edge.label as string)?.replace("Loop:", "");
        mermaidEdges += `    ${sourceId} -- ${loopLabel || "Loop"} --> ${targetId} [Loop: ${loopLabel || "N/A"}];\n`;
      } else {
        mermaidEdges += `    ${sourceId} -- ${label} --> ${targetId};\n`;
      }
    }
    return mermaidEdges;
  }

  private renderAdvancedFlowControl(mermaidGraph: string): string {
    let advancedMermaid = "";

    if (this.context.conditionalPaths && this.context.conditionalPaths.size > 0) {
      advancedMermaid += "\n%% --- Advanced Conditional Branches ---\n";
      for (const [key, path] of this.context.conditionalPaths) {
        advancedMermaid += `subgraph Conditional_${key}\n`;
        advancedMermaid += `    direction LR\n`;
        advancedMermaid += `    Start_${key} --> ${path.nextNodes.join(" --> ")}[Condition: ${path.condition}];\n`;
        advancedMermaid += `end\n`;
      }
    }

    if (this.context.loopPaths && this.context.loopPaths.size > 0) {
      advancedMermaid += "\n%% --- Advanced Loop Structures ---\n";
      for (const [key, path] of this.context.loopPaths) {
        advancedMermaid += `subgraph Loop_${key}\n`;
        advancedMermaid += `    direction TB\n`;
        advancedMermaid += `    LoopStart_${key} --> LoopBody_${key} -- Iteration --> LoopStart_${key};\n`;
        advancedMermaid += `    LoopBody_${key} --> Exit_${key} [Exit Condition Met];\n`;
        advancedMermaid += `end\n`;
      }
    }
    return advancedMermaid;
  }

  public renderMermaid(graph: GraphContext): string {
    let mermaidCode = "graph TD\n";
    let nodeDefinitions = "";
    let edgeDefinitions = "";

    const nodes = graph.nodes;
    const edges = graph.edges;

    // 1. Render Nodes
    for (const node of nodes) {
      nodeDefinitions += this.renderNodeMermaid(node);
    }

    // 2. Render Edges
    edgeDefinitions = this.renderEdgesMermaid(edges);

    // 3. Combine and add advanced flow control visualization
    let finalMermaid = `${mermaidCode}\n%% --- Standard Nodes ---\n${nodeDefinitions}\n`;
    finalMermaid += `%% --- Standard Edges ---\n${edgeDefinitions}`;
    finalMermaid += this.renderAdvancedFlowControl(mermaidCode);

    return finalMermaid;
  }
}