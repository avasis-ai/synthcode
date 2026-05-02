import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_result: string };

export interface Node {
  id: string;
  label: string;
  properties: Record<string, any>;
  context: Record<string, any>;
}

export interface Edge {
  sourceId: string;
  targetId: string;
  type: string;
  properties: Record<string, any>;
  context: Record<string, any>;
}

export interface Triple {
  subjectId: string;
  predicate: string;
  objectId: string;
  properties: Record<string, any>;
  context: Record<string, any>;
}

export interface ContextualKnowledgeGraph {
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
  triples: Map<string, Triple>;
}

export type DiffOperation = "ADDED" | "REMOVED" | "MODIFIED";

export interface DiffItem<T> {
  operation: DiffOperation;
  item: T;
  details?: {
    oldValue?: any;
    newValue?: any;
  };
}

export interface ContextualGraphDiffPayload {
  nodes: {
    [key: string]: DiffItem<Node>;
  };
  edges: {
    [key: string]: DiffItem<Edge>;
  };
  triples: {
    [key: string]: DiffItem<Triple>;
  };
}

export interface ContextualGraphDiffReport {
  summary: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
    edgesModified: number;
    triplesAdded: number;
    triplesRemoved: number;
    triplesModified: number;
  };
  diff: ContextualGraphDiffPayload;
}

export class ContextualKnowledgeGraphDiffer {
  private currentGraph: ContextualKnowledgeGraph;
  private nextGraph: ContextualKnowledgeGraph;

  constructor(currentGraph: ContextualKnowledgeGraph, nextGraph: ContextualKnowledgeGraph) {
    this.currentGraph = currentGraph;
    this.nextGraph = nextGraph;
  }

  private compareNodes(
    currentNode: Node,
    nextNode: Node
  ): DiffItem<Node> | null {
    const nodeKey = `${currentNode.id}`;
    const propsChanged = this.deepEquals(currentNode.properties, nextNode.properties) ? false : true;
    const contextChanged = this.deepEquals(currentNode.context, nextNode.context) ? false : true;

    if (!propsChanged && !contextChanged) {
      return null;
    }

    return {
      operation: "MODIFIED",
      item: nextNode,
      details: {
        oldValue: currentNode,
        newValue: nextNode,
      },
    };
  }

  private compareEdges(
    currentEdge: Edge,
    nextEdge: Edge
  ): DiffItem<Edge> | null {
    const edgeKey = `${currentEdge.sourceId}-${currentEdge.targetId}-${currentEdge.type}`;
    const propsChanged = this.deepEquals(currentEdge.properties, nextEdge.properties) ? false : true;
    const contextChanged = this.deepEquals(currentEdge.context, nextEdge.context) ? false : true;

    if (!propsChanged && !contextChanged) {
      return null;
    }

    return {
      operation: "MODIFIED",
      item: nextEdge,
      details: {
        oldValue: currentEdge,
        newValue: nextEdge,
      },
    };
  }

  private compareTriples(
    currentTriple: Triple,
    nextTriple: Triple
  ): DiffItem<Triple> | null {
    const tripleKey = `${currentTriple.subjectId}:${currentTriple.predicate}:${currentTriple.objectId}`;
    const propsChanged = this.deepEquals(currentTriple.properties, nextTriple.properties) ? false : true;
    const contextChanged = this.deepEquals(currentTriple.context, nextTriple.context) ? false : true;

    if (!propsChanged && !contextChanged) {
      return null;
    }

    return {
      operation: "MODIFIED",
      item: nextTriple,
      details: {
        oldValue: currentTriple,
        newValue: nextTriple,
      },
    };
  }

  private deepEquals(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.deepEquals(a[key], b[key])) return false;
    }
    return true;
  }

  public generateDiffReport(): ContextualGraphDiffReport {
    const diff: ContextualGraphDiffPayload = {
      nodes: {},
      edges: {},
      triples: {},
    };

    const nodeDiffs: Record<string, DiffItem<Node>> = {};
    const edgeDiffs: Record<string, DiffItem<Edge>> = {};
    const tripleDiffs: Record<string, DiffItem<Triple>> = {};

    // 1. Node Comparison
    const currentNodes = Array.from(this.currentGraph.nodes.values());
    const nextNodes = Array.from(this.nextGraph.nodes.values());
    const nextNodeMap = new Map<string, Node>();
    nextNodes.forEach(node => nextNodeMap.set(node.id, node));

    for (const currentNode of currentNodes) {
      const nextNode = nextNodeMap.get(currentNode.id);
      if (!nextNode) {
        nodeDiffs[`${currentNode.id}`] = {
          operation: "REMOVED",
          item: currentNode,
        };
      } else {
        const diff = this.compareNodes(currentNode, nextNode);
        if (diff) {
          nodeDiffs[`${currentNode.id}`] = diff;
        }
      }
    }

    for (const nextNode of nextNodes) {
      if (!nodeDiffs[`${nextNode.id}`]) {
        nodeDiffs[`${nextNode.id}`] = {
          operation: "ADDED",
          item: nextNode,
        };
      }
    }

    // 2. Edge Comparison
    const currentEdges = Array.from(this.currentGraph.edges.values());
    const nextEdges = Array.from(this.nextGraph.edges.values());
    const nextEdgeMap = new Map<string, Edge>();
    nextEdges.forEach(edge => nextEdgeMap.set(`${edge.sourceId}-${edge.targetId}-${edge.type}`, edge));

    for (const currentEdge of currentEdges) {
      const edgeKey = `${currentEdge.sourceId}-${currentEdge.targetId}-${currentEdge.type}`;
      const nextEdge = nextEdgeMap.get(edgeKey);
      if (!nextEdge) {
        edgeDiffs[`${edgeKey}`] = {
          operation: "REMOVED",
          item: currentEdge,
        };
      } else {
        const diff = this.compareEdges(currentEdge, nextEdge);
        if (diff) {
          edgeDiffs[`${edgeKey}`] = diff;
        }
      }
    }

    for (const nextEdge of nextEdges) {
      const edgeKey = `${nextEdge.sourceId}-${nextEdge.targetId}-${nextEdge.type}`;
      if (!edgeDiffs[edgeKey]) {
        edgeDiffs[edgeKey] = {
          operation: "ADDED",
          item: nextEdge,
        };
      }
    }

    // 3. Triple Comparison
    const currentTriples = Array.from(this.currentGraph.triples.values());
    const nextTriples = Array.from(this.nextGraph.triples.values());
    const nextTripleMap = new Map<string, Triple>();
    nextTriples.forEach(triple => nextTripleMap.set(`${triple.subjectId}:${triple.predicate}:${triple.objectId}`, triple));

    for (const currentTriple of currentTriples) {
      const tripleKey = `${currentTriple.subjectId}:${currentTriple.predicate}:${currentTriple.objectId}`;
      const nextTriple = nextTripleMap.get(tripleKey);
      if (!nextTriple) {
        tripleDiffs[`${tripleKey}`] = {
          operation: "REMOVED",
          item: currentTriple,
        };
      } else {
        const diff = this.compareTriples(currentTriple, nextTriple);
        if (diff) {
          tripleDiffs[`${tripleKey}`] = diff;
        }
      }
    }

    for (const nextTriple of nextTriples) {
      const tripleKey = `${nextTriple.subjectId}:${nextTriple.predicate}:${nextTriple.objectId}`;
      if (!tripleDiffs[tripleKey]) {
        tripleDiffs[`${tripleKey}`] = {
          operation: "ADDED",
          item: nextTriple,
        };
      }
    }

    // 4. Build Report
    const summary = {
      nodesAdded: 0,
      nodesRemoved: 0,
      nodesModified: 0,
      edgesAdded: 0,
      edgesRemoved: 0,
      edgesModified: 0,
      triplesAdded: 0,
      triplesRemoved: 0,
      triplesModified: 0,
    };

    (Object.values(nodeDiffs) as DiffItem<Node>[]).forEach(diff => {
      if (diff.operation === "ADDED") summary.nodesAdded++;
      else if (diff.operation === "REMOVED") summary.nodesRemoved++;
      else if (diff.operation === "MODIFIED") summary.nodesModified++;
    });

    (Object.values(edgeDiffs) as DiffItem<Edge>[]).forEach(diff => {
      if (diff.operation === "ADDED") summary.edgesAdded++;
      else if (diff.operation === "REMOVED") summary.edgesRemoved++;
      else if (diff.operation === "MODIFIED") summary.edgesModified++;
    });

    (Object.values(tripleDiffs) as DiffItem<Triple>[]).forEach(diff => {
      if (diff.operation === "ADDED") summary.triplesAdded++;
      else if (diff.operation === "REMOVED") summary.triplesRemoved++;
      else if (diff.operation === "MODIFIED") summary.triplesModified++;
    });

    return {
      summary,
      diff: {
        nodes: nodeDiffs,
        edges: edgeDiffs,
        triples: tripleDiffs,
      },
    };
  }
}

export { ContextualKnowledgeGraphDiffer };