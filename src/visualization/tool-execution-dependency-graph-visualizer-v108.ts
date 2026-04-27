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

export interface ResourceMetadata {
  resourceName: string;
  usageAmount: number;
  unit: string;
}

export interface TemporalMetadata {
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
}

export interface DependencyEdge {
  sourceNodeId: string;
  targetNodeId: string;
  metadata?: {
    temporal?: TemporalMetadata;
    resources?: ResourceMetadata[];
  };
}

export interface GraphNode {
  id: string;
  type: "tool_execution" | "user_input" | "assistant_response";
  metadata: {
    [key: string]: any;
  };
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

export class ToolExecutionDependencyGraphVisualizerV108 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private getEdgeColor(edge: DependencyEdge): string {
    if (edge.metadata?.resources && edge.metadata.resources.length > 0) {
      const totalUsage = edge.metadata.resources.reduce(
        (sum, res) => sum + res.usageAmount,
        0
      );
      if (totalUsage > 50) return "red";
      if (totalUsage > 20) return "orange";
      return "green";
    }
    return "gray";
  }

  private renderResourceBar(edge: DependencyEdge): React.ReactNode {
    const resources = edge.metadata?.resources;
    if (!resources || resources.length === 0) {
      return null;
    }

    return (
      <div style={{ display: "flex", gap: "5px", fontSize: "0.8em" }}>
        {resources.map((res, index) => (
          <div
            key={index}
            style={{
              width: `${Math.min(100, res.usageAmount * 2)}%`,
              height: "10px",
              backgroundColor: res.resourceName === "CPU" ? "blue" : "purple",
              borderRadius: "2px",
            }}
            title={`${res.resourceName}: ${res.usageAmount}${res.unit}`}
          />
        ))}
      </div>
    );
  }

  private renderTemporalIndicator(edge: DependencyEdge): React.ReactNode {
    const temporal = edge.metadata?.temporal;
    if (!temporal) {
      return null;
    }

    const duration = temporal.durationMs;
    const color = duration > 1000 ? "red" : "green";

    return (
      <div style={{ display: "inline-block", width: `${Math.min(100, duration / 10)}%`, height: "8px", backgroundColor: color, marginRight: "10px" }} />
    );
  }

  public render(containerId: string): React.ReactElement {
    const nodes = this.graph.nodes;
    const edges = this.graph.edges;

    const renderNode = (node: GraphNode): React.ReactElement => {
      let content = "";
      switch (node.type) {
        case "tool_execution":
          content = `Tool: ${node.metadata.toolName || "Unknown"}`;
          break;
        case "user_input":
          content = `User Input`;
          break;
        case "assistant_response":
          content = `Assistant Response`;
          break;
      }
      return <div key={node.id} style={{ border: "1px solid #ccc", padding: "10px", margin: "5px", borderRadius: "5px" }}>{content}</div>;
    };

    const renderEdge = (edge: DependencyEdge): React.ReactElement => {
      const color = this.getEdgeColor(edge);
      const resourceBar = this.renderResourceBar(edge);
      const temporalIndicator = this.renderTemporalIndicator(edge);

      return (
        <div key={`${edge.sourceNodeId}-${edge.targetNodeId}`} style={{ borderBottom: `2px solid ${color}`, padding: "5px 0", display: "flex", alignItems: "center", width: "100%" }}>
          <span style={{ marginRight: "20px" }}>{temporalIndicator}</span>
          <div style={{ flexGrow: 1 }}>
            {resourceBar}
          </div>
          <span style={{ fontSize: "0.9em", color: "#666" }}>{edge.sourceNodeId} -> {edge.targetNodeId}</span>
        </div>
      );
    };

    const nodeElements = nodes.map(renderNode);
    const edgeElements = edges.map(renderEdge);

    return (
      <div id={containerId} style={{ fontFamily: "sans-serif" }}>
        <h3>Dependency Graph (V108)</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
          {nodeElements}
        </div>
        <h4>Dependencies:</h4>
        <div style={{ border: "1px dashed #aaa", padding: "15px" }}>
          {edgeElements.length > 0 ? edgeElements : <p>No dependencies found.</p>}
        </div>
      </div>
    );
  }
}