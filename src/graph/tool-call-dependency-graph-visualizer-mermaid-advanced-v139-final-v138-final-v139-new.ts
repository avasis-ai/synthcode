import { DependencyGraph, Message, ContentBlock } from "./dependency-graph-types";

export interface GraphVisualizerOptions {
  conditionalPaths?: Record<string, string[]>;
  loopNodes?: string[];
  startNodeId?: string;
}

export class ToolCallDependencyGraphVisualizer {
  private options: GraphVisualizerOptions;

  constructor(options: GraphVisualizerOptions = {}) {
    this.options = {
      conditionalPaths: {},
      loopNodes: [],
      startNodeId: "start",
      ...options,
    };
  }

  private generateNodeDefinition(nodeId: string, nodeType: string, label: string): string {
    return `    ${nodeId}["${label}"]`;
  }

  private generateEdgeDefinition(fromId: string, toId: string, label: string = ""): string {
    return `    ${fromId} --> ${toId}${label ? `[${label}]` : ""};`;
  }

  private generateConditionalMermaid(graph: DependencyGraph): string {
    const paths = this.options.conditionalPaths;
    if (!paths || Object.keys(paths).length === 0) {
      return "";
    }

    let mermaid = "%% Conditional Paths\n";
    for (const condition in paths) {
      const targets = paths[condition];
      mermaid += `    ${condition} -->|${condition}| ${targets.join(" --> ")};\n`;
    }
    return mermaid;
  }

  private generateLoopMermaid(graph: DependencyGraph): string {
    const loopNodes = this.options.loopNodes;
    if (!loopNodes || loopNodes.length === 0) {
      return "";
    }

    let mermaid = "%% Loop Structures\n";
    for (const nodeId of loopNodes) {
      // Assuming loop nodes connect back to themselves or a predecessor
      mermaid += `    ${nodeId} -- Loop Back --> ${nodeId};\n`;
    }
    return mermaid;
  }

  public visualize(graph: DependencyGraph): string {
    let mermaid = "graph TD\n";
    let nodeDefinitions: string[] = [];
    let edgeDefinitions: string[] = [];

    // 1. Define Nodes
    const allNodeIds = new Set<string>();
    const nodeDetails: Record<string, { type: string; label: string }> = {};

    graph.nodes.forEach(node => {
      const nodeId = node.id;
      allNodeIds.add(nodeId);
      let label = "";
      let nodeType = "process";

      if (node.isStart) {
        nodeType = "start";
        label = "Start";
      } else if (node.isEnd) {
        nodeType = "end";
        label = "End";
      } else if (node.isConditional) {
        nodeType = "conditional";
        label = "Decision Point";
      } else if (node.isLoop) {
        nodeType = "loop";
        label = "Loop Iteration";
      } else {
        label = node.description || `Step ${node.id}`;
      }

      nodeDetails[nodeId] = { type: nodeType, label: label };
      nodeDefinitions.push(this.generateNodeDefinition(nodeId, nodeType, label));
    });

    // 2. Define Edges (Basic Flow)
    graph.edges.forEach(edge => {
      const fromId = edge.fromId;
      const toId = edge.toId;
      let label = "";

      if (edge.type === "tool_call") {
        label = `Call ${edge.toolName}`;
      } else if (edge.type === "response") {
        label = "Response Received";
      } else if (edge.type === "conditional_branch") {
        label = edge.condition;
      }

      edgeDefinitions.push(this.generateEdgeDefinition(fromId, toId, label));
    });

    // 3. Assemble Mermaid Structure
    mermaid += nodeDefinitions.join("\n") + "\n";
    mermaid += edgeDefinitions.join("\n") + "\n";

    // 4. Append Advanced Features
    mermaid += this.generateConditionalMermaid(graph);
    mermaid += this.generateLoopMermaid(graph);

    return mermaid;
  }
}