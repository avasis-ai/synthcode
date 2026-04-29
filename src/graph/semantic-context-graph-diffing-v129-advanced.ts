import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface Node {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
}

interface Edge {
  sourceId: string;
  targetId: string;
  type: string;
  attributes: Record<string, unknown>;
}

interface SemanticGraph {
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
}

interface AttributeDiff {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  isModified: boolean;
}

interface NodeDiff {
  nodeId: string;
  diff: {
    attributes: AttributeDiff[];
    isAdded: boolean;
    isRemoved: boolean;
  };
}

interface EdgeDiff {
  edgeId: string;
  diff: {
    attributes: AttributeDiff[];
    isModified: boolean;
  };
}

interface GraphDiffReport {
  structuralChanges: {
    addedNodes: string[];
    removedNodes: string[];
    addedEdges: string[];
    removedEdges: string[];
  };
  nodeDiffs: NodeDiff[];
  edgeDiffs: EdgeDiff[];
  semanticDriftSummary: {
    nodeCountChange: number;
    edgeCountChange: number;
    attributeDriftCount: number;
  };
}

class SemanticContextGraphDiffer {
  private graphA: SemanticGraph;
  private graphB: SemanticGraph;

  constructor(graphA: SemanticGraph, graphB: SemanticGraph) {
    this.graphA = graphA;
    this.graphB = graphB;
  }

  private compareAttributes(oldAttrs: Record<string, unknown>, newAttrs: Record<string, unknown>): AttributeDiff[] {
    const diffs: AttributeDiff[] = [];
    const allKeys = new Set([...Object.keys(oldAttrs), ...Object.keys(newAttrs)]);

    for (const key of allKeys) {
      const oldValue = oldAttrs[key];
      const newValue = newAttrs[key];

      if (oldValue === undefined && newValue !== undefined) {
        diffs.push({ path: key, oldValue: undefined, newValue: newValue, isModified: true });
      } else if (oldValue !== undefined && newValue === undefined) {
        diffs.push({ path: key, oldValue: oldValue, newValue: undefined, isModified: true });
      } else if (oldValue !== newValue) {
        diffs.push({ path: key, oldValue: oldValue, newValue: newValue, isModified: true });
      }
    }
    return diffs;
  }

  private compareNodes(
    nodeA: Node,
    nodeB: Node
  ): NodeDiff {
    const attrDiffs = this.compareAttributes(nodeA.attributes, nodeB.attributes);
    return {
      nodeId: nodeA.id,
      diff: {
        attributes: attrDiffs,
        isAdded: false,
        isRemoved: false,
      },
    };
  }

  private compareEdges(
    edgeA: Edge,
    edgeB: Edge
  ): EdgeDiff {
    const attrDiffs = this.compareAttributes(edgeA.attributes, edgeB.attributes);
    return {
      edgeId: edgeA.id,
      diff: {
        attributes: attrDiffs,
        isModified: attrDiffs.length > 0,
      },
    };
  }

  public diffGraphs(): GraphDiffReport {
    const nodeMapA = this.graphA.nodes;
    const nodeMapB = this.graphB.nodes;

    const allNodeIds = new Set([...nodeMapA.keys(), ...nodeMapB.keys()]);
    const allEdgeIds = new Set([...this.graphA.edges.keys(), ...this.graphB.edges.keys()]);

    const nodeDiffs: NodeDiff[] = [];
    const structuralChanges: {
      addedNodes: string[];
      removedNodes: string[];
      addedEdges: string[];
      removedEdges: string[];
    } = {
      addedNodes: [],
      removedNodes: [],
      addedEdges: [],
      removedEdges: [],
    };

    // Node Comparison
    for (const nodeId of allNodeIds) {
      const nodeA = nodeMapA.get(nodeId);
      const nodeB = nodeMapB.get(nodeId);

      if (nodeA && !nodeB) {
        structuralChanges.removedNodes.push(nodeId);
        nodeDiffs.push({ nodeId: nodeId, diff: { attributes: [], isAdded: false, isRemoved: true } });
      } else if (!nodeA && nodeB) {
        structuralChanges.addedNodes.push(nodeId);
        nodeDiffs.push({ nodeId: nodeId, diff: { attributes: [], isAdded: true, isRemoved: false } });
      } else if (nodeA && nodeB) {
        nodeDiffs.push(this.compareNodes(nodeA, nodeB));
      }
    }

    // Edge Comparison (Assuming edge IDs are unique identifiers for the relationship)
    const edgeDiffs: EdgeDiff[] = [];
    for (const edgeId of allEdgeIds) {
      const edgeA = this.graphA.edges.get(edgeId);
      const edgeB = this.graphB.edges.get(edgeId);

      if (edgeA && !edgeB) {
        structuralChanges.removedEdges.push(edgeId);
        edgeDiffs.push({ edgeId: edgeId, diff: { attributes: [], isModified: true } });
      } else if (!edgeA && edgeB) {
        structuralChanges.addedEdges.push(edgeId);
        edgeDiffs.push({ edgeId: edgeId, diff: { attributes: [], isModified: false } });
      } else if (edgeA && edgeB) {
        edgeDiffs.push(this.compareEdges(edgeA, edgeB));
      }
    }

    const semanticDriftSummary = {
      nodeCountChange: nodeMapB.size - nodeMapA.size,
      edgeCountChange: this.graphB.edges.size - this.graphA.edges.size,
      attributeDriftCount: nodeDiffs.filter(d => d.diff.attributes.length > 0).length + edgeDiffs.filter(d => d.diff.attributes.length > 0).length,
    };

    return {
      structuralChanges,
      nodeDiffs,
      edgeDiffs,
      semanticDriftSummary,
    };
  }
}

export { SemanticContextGraphDiffer };