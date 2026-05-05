import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface ToolCallContext {
  tool_name: string;
  input_params: Record<string, unknown>;
  resource_estimate: {
    cpu_ms: number;
    memory_kb: number;
  };
  temporal_window_ms: {
    start: number;
    end: number;
  };
}

export interface DependencyEdge {
  source_id: string;
  target_id: string;
  dependency_type: "contextual" | "temporal" | "resource";
  weight: number;
}

export interface ToolCallNode {
  id: string;
  tool_name: string;
  context: ToolCallContext;
}

export interface ContextualGraphPayload {
  messages: Message[];
  tool_calls: ToolCallNode[];
  dependencies: DependencyEdge[];
}

export class ContextualToolCallDependencyGraphVisualizer {
  private readonly graphPayload: ContextualGraphPayload;

  constructor(payload: ContextualGraphPayload) {
    this.graphPayload = payload;
  }

  private enrichContext(messages: Message[]): Map<string, ToolCallContext> {
    const contextMap = new Map<string, ToolCallContext>();
    // Simplified enrichment: In a real system, this would analyze message history
    // to derive resource/temporal constraints for known tool calls.
    // For this implementation, we assume tool_calls already contain necessary context.
    return new Map();
  }

  private buildDependencies(toolCalls: ToolCallNode[], messages: Message[]): DependencyEdge[] {
    const dependencies: DependencyEdge[] = [];
    // Placeholder logic: Connect all tool calls sequentially and based on message flow.
    for (let i = 0; i < toolCalls.length - 1; i++) {
      const current = toolCalls[i];
      const next = toolCalls[i + 1];

      // Temporal dependency (simple sequence)
      dependencies.push({
        source_id: current.id,
        target_id: next.id,
        dependency_type: "temporal",
        weight: 1.0,
      });

      // Resource dependency (if they use overlapping resources)
      const resourceOverlap = Math.max(0, Math.min(
        current.context.resource_estimate.cpu_ms,
        next.context.resource_estimate.cpu_ms
      ) - Math.abs(current.context.resource_estimate.cpu_ms - next.context.resource_estimate.cpu_ms));

      if (resourceOverlap > 0) {
        dependencies.push({
          source_id: current.id,
          target_id: next.id,
          dependency_type: "resource",
          weight: resourceOverlap / 1000,
        });
      }
    }
    return dependencies;
  }

  public generateVisualizationData(): { nodes: any[]; edges: any[] } {
    const enrichedContext = this.enrichContext(this.graphPayload.messages);
    const finalDependencies = this.buildDependencies(this.graphPayload.tool_calls, this.graphPayload.messages);

    const nodes = this.graphPayload.tool_calls.map(tc => ({
      id: tc.id,
      label: `${tc.context.tool_name} (${tc.context.input_params['param'] || 'N/A'})`,
      style: this.getNodeStyle(tc.context),
      context: tc.context,
    }));

    const edges = finalDependencies.map(dep => ({
      source: dep.source_id,
      target: dep.target_id,
      type: dep.dependency_type,
      weight: dep.weight,
      style: this.getEdgeStyle(dep),
    }));

    return { nodes, edges };
  }

  private getNodeStyle(context: ToolCallContext): { color: string; shape: string } {
    if (context.resource_estimate.cpu_ms > 500) {
      return { color: "#FF6347", shape: "octagon" }; // High CPU usage
    }
    if (context.temporal_window_ms.end - context.temporal_window_ms.start > 1000) {
      return { color: "#4682B4", shape: "rounded" }; // Long duration
    }
    return { color: "#3CB371", shape: "circle" }; // Default
  }

  private getEdgeStyle(dependency: DependencyEdge): { strokeColor: string; dash: string } {
    switch (dependency.dependency_type) {
      case "temporal":
        return { strokeColor: "#8A2BE2", dash: "solid" };
      case "resource":
        return { strokeColor: "#FFD700", dash: "dashed" };
      case "contextual":
        return { strokeColor: "#2F4F4F", dash: "dot" };
    }
  }
}