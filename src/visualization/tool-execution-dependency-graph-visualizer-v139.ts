import {
  ToolInvocationRecord,
  ToolExecutionDependencyGraphPayload,
  ToolExecutionHistory,
} from "./types";

export class ToolExecutionDependencyGraphVisualizer {
  private history: ToolExecutionHistory;
  private payload: ToolExecutionDependencyGraphPayload;

  constructor(history: ToolExecutionHistory, payload: ToolExecutionDependencyGraphPayload) {
    this.history = history;
    this.payload = payload;
  }

  public buildGraphStructure(): {
    nodes: any[];
    edges: any[];
  } {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Simple representation: Nodes are tool calls, Edges are dependencies
    this.payload.toolInvocations.forEach((invocation, index) => {
      const nodeId = `tool-${invocation.tool_use_id || index}`;
      nodes.push({
        id: nodeId,
        type: "tool_call",
        label: `${invocation.tool_name} (${invocation.tool_use_id || index})`,
        details: {
          input: invocation.input,
          output: invocation.output,
        },
      });
    });

    this.payload.dataDependencies.forEach((dependency, index) => {
      const sourceNodeId = `tool-${dependency.sourceToolUseId}`;
      const targetNodeId = `tool-${dependency.targetToolUseId}`;

      edges.push({
        source: sourceNodeId,
        target: targetNodeId,
        type: "data_flow",
        data_key: dependency.dataKey,
        description: `Data '${dependency.dataKey}' flowed from ${dependency.sourceToolUseId} to ${dependency.targetToolUseId}`,
      });
    });

    return { nodes, edges };
  }

  public renderVisualization(): string {
    const { nodes, edges } = this.buildGraphStructure();

    let output = "--- Tool Execution Dependency Graph Visualization ---\n";
    output += `Total Nodes (Tool Calls): ${nodes.length}\n`;
    output += `Total Edges (Data Dependencies): ${edges.length}\n\n`;

    output += "--- Nodes (Tool Invocations) ---\n";
    nodes.forEach((node, index) => {
      output += `[${index}] ID: ${node.id}\n`;
      output += `    Label: ${node.label}\n`;
      output += `    Input: ${JSON.stringify(node.details.input).substring(0, 100)}...\n`;
      output += `    Output: ${JSON.stringify(node.details.output).substring(0, 100)}...\n\n`;
    });

    output += "--- Edges (Data Dependencies) ---\n";
    edges.forEach((edge, index) => {
      output += `[${index}] Type: ${edge.type} (Data Flow)\n`;
      output += `    From: ${edge.source}\n`;
      output += `    To: ${edge.target}\n`;
      output += `    Data Key: ${edge.data_key}\n`;
      output += `    Description: ${edge.description}\n\n`;
    });

    return output;
  }
}