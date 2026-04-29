import { BehaviorSubject, Observable } from "rxjs";

export interface Node {
  id: string;
  label: string;
  type: "tool" | "concept";
  data: Record<string, unknown>;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  relationship: string;
}

export interface GraphData {
  nodes: Set<Node>;
  edges: Set<Edge>;
}

export interface GraphUpdatePatch {
  nodesToAdd: Node[];
  nodesToUpdate: Record<string, Partial<Node>>;
  nodesToRemove: string[];
  edgesToAdd: Edge[];
  edgesToUpdate: Record<string, Partial<Edge>>;
  edgesToRemove: string[];
}

export class DynamicToolDependencyGraphVisualizer {
  private graphSubject: BehaviorSubject<GraphData>;
  public graphUpdate$: Observable<GraphData>;

  constructor(initialData: GraphData) {
    this.graphSubject = new BehaviorSubject<GraphData>(initialData);
    this.graphUpdate$ = this.graphSubject.asObservable();
  }

  private mergeNodes(currentNodes: Set<Node>, patch: GraphUpdatePatch): Set<Node> {
    const newNodes = new Set<Node>(currentNodes);

    patch.nodesToAdd.forEach(node => newNodes.add(node));

    patch.nodesToUpdate.forEach((partialNode, id) => {
      const existingNode = Array.from(newNodes).find(n => n.id === id);
      if (existingNode) {
        const updatedNode: Node = {
          ...existingNode,
          ...partialNode as Partial<Node>,
        };
        newNodes.delete(existingNode);
        newNodes.add(updatedNode);
      }
    });

    patch.nodesToRemove.forEach(id => {
      const nodeToRemove = Array.from(newNodes).find(n => n.id === id);
      if (nodeToRemove) {
        newNodes.delete(nodeToRemove);
      }
    });

    return newNodes;
  }

  private mergeEdges(currentEdges: Set<Edge>, patch: GraphUpdatePatch): Set<Edge> {
    const newEdges = new Set<Edge>(currentEdges);

    patch.edgesToAdd.forEach(edge => newEdges.add(edge));

    patch.edgesToUpdate.forEach((partialEdge, id) => {
      const existingEdge = Array.from(newEdges).find(e => e.id === id);
      if (existingEdge) {
        const updatedEdge: Edge = {
          ...existingEdge,
          ...partialEdge as Partial<Edge>,
        };
        newEdges.delete(existingEdge);
        newEdges.add(updatedEdge);
      }
    });

    patch.edgesToRemove.forEach(id => {
      const edgeToRemove = Array.from(newEdges).find(e => e.id === id);
      if (edgeToRemove) {
        newEdges.delete(edgeToRemove);
      }
    });

    return newEdges;
  }

  public updateGraph(patch: GraphUpdatePatch): void {
    const currentData = this.graphSubject.getValue();

    const newNodes = this.mergeNodes(currentData.nodes, patch);
    const newEdges = this.mergeEdges(currentData.edges, patch);

    const newGraphData: GraphData = {
      nodes: newNodes,
      edges: newEdges,
    };

    this.graphSubject.next(newGraphData);
  }

  public subscribeToUpdates(): Observable<GraphData> {
    return this.graphUpdate$;
  }
}