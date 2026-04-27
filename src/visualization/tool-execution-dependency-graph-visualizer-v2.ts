import { ToolCall, ToolResult } from "./tool-execution-graph-types";

export class ToolExecutionDependencyGraphVisualizerV2 {
  private graph: {
    source: ToolCall;
    target: ToolCall | ToolResult;
  }[];

  constructor(graph: {
    source: ToolCall;
    target: ToolCall | ToolResult;
  }[]): void {
    this.graph = graph;
  }

  private formatNode(node: ToolCall | ToolResult): string {
    if (typeof node === 'object' && node !== null && 'tool_name' in node && 'tool_call_id' in node) {
      return `[ToolCall: ${node['tool_name']} (${node['tool_call_id']})]`;
    }
    if (typeof node === 'object' && node !== null && 'tool_result_id' in node) {
      return `[ToolResult: ${node['tool_result_id']}]`;
    }
    return "[Unknown Node]";
  }

  private formatEdge(source: ToolCall, target: ToolCall | ToolResult): string {
    const sourceStr = this.formatNode(source);
    let targetStr: string;

    if (typeof target === 'object' && 'tool_result_id' in target) {
      targetStr = this.formatNode(target);
    } else if (typeof target === 'object' && 'tool_name' in target && 'tool_call_id' in target) {
      targetStr = this.formatNode(target);
    } else {
      targetStr = "[Invalid Target]";
    }

    return `${sourceStr} --> ${targetStr}`;
  }

  public renderGraph(): string {
    if (!this.graph || this.graph.length === 0) {
      return "No tool execution dependencies to visualize.";
    }

    let output = "--- Tool Execution Dependency Graph (V2) ---\n";
    output += "Focus: Sequential ToolCall -> ToolCall or ToolCall -> ToolResult\n\n";

    for (let i = 0; i < this.graph.length; i++) {
      const edge = this.graph[i];
      output += `${this.formatEdge(edge.source, edge.target)}\n`;
    }

    output += "\n-------------------------------------------------\n";
    return output;
  }
}