import { EventEmitter } from "events";

export interface DependencyNode {
  id: string;
  name: string;
  dependencies: string[];
  status: "pending" | "resolved" | "failed";
  metadata: Record<string, unknown>;
}

export interface DependencyEdge {
  fromId: string;
  toId: string;
  type: "depends_on";
}

export interface DynamicGraphData {
  nodes: Map<string, DependencyNode>;
  edges: Set<string>; // Store edges as unique identifiers, e.g., "fromId->toId"
}

export interface GraphUpdate {
  nodes: Partial<Map<string, DependencyNode>>;
  edges: Partial<Set<string>>;
}

export class DynamicToolDependencyGraphVisualizer extends EventEmitter {
  private graphData: DynamicGraphData;

  constructor() {
    super();
    this.graphData = {
      nodes: new Map(),
      edges: new Set<string>(),
    };
  }

  public initializeGraph(initialNodes: DependencyNode[], initialEdges: DependencyEdge[]): void {
    this.graphData.nodes = new Map(
      initialNodes.map((node) => [node.id, node])
    );
    this.graphData.edges = new Set(
      initialEdges.map((edge) => `${edge.fromId}->${edge.toId}`)
    );
    this.emit("graphInitialized", this.graphData);
  }

  public updateGraph(update: GraphUpdate): void {
    const newNodes = new Map<string, DependencyNode>();
    const updatedNodes = new Map<string, DependencyNode>();

    // Apply node updates
    if (update.nodes) {
      for (const [id, nodeUpdate] of Object.entries(update.nodes)) {
        const existingNode = this.graphData.nodes.get(id) || {
          id: id,
          name: `Unknown Tool ${id}`,
          dependencies: [],
          status: "pending",
          metadata: {},
        };
        updatedNodes.set(id, {
          ...existingNode,
          ...nodeUpdate,
          metadata: { ...existingNode.metadata, ...(nodeUpdate as any)?.metadata },
        });
      }
    }

    // Apply edge updates
    if (update.edges) {
      for (const edgeId of (update.edges as any) as Set<string>) {
        this.graphData.edges.add(edgeId);
      }
    }

    // Merge updates
    this.graphData.nodes = new Map([...this.graphData.nodes, ...updatedNodes]);
    this.emit("graphUpdated", this.graphData);
  }

  public getGraphData(): DynamicGraphData {
    return this.graphData;
  }

  public renderVisualization(renderer: {
    render: (data: DynamicGraphData) => void;
  }): void {
    renderer.render(this.graphData);
  }
}