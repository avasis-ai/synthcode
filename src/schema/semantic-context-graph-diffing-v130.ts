import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type GraphPayload = {
  nodes: Record<string, { id: string; data: any }>;
  edges: Record<string, { source: string; target: string; weight: number; metadata: Record<string, unknown> }>;
};

type ChangeMetadata = {
  change_type: "ADDED" | "REMOVED" | "MODIFIED";
  timestamp: number;
  source: string;
};

type NodeDiff = {
  id: string;
  change_metadata: ChangeMetadata;
  old_data?: any;
  new_data?: any;
};

type EdgeDiff = {
  id: string;
  change_metadata: ChangeMetadata;
  old_metadata?: Record<string, unknown>;
  new_metadata?: Record<string, unknown>;
};

export interface ContextGraphDiff {
  node_diffs: NodeDiff[];
  edge_diffs: EdgeDiff[];
}

export class SemanticContextGraphDiffer {
  private readonly sourceIdentifier: string;

  constructor(sourceIdentifier: string) {
    this.sourceIdentifier = sourceIdentifier;
  }

  private calculateHash(data: any): string {
    const serialized = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      hash = ((hash << 5) - hash) + serialized.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  private compareNodes(
    graphA: GraphPayload,
    graphB: GraphPayload,
  ): {
    added: NodeDiff[];
    removed: NodeDiff[];
    modified: NodeDiff[];
  } {
    const allIds = new Set<string>([
      ...Object.keys(graphA.nodes),
      ...Object.keys(graphB.nodes),
    ]);

    const added: NodeDiff[] = [];
    const removed: NodeDiff[] = [];
    const modified: NodeDiff[] = [];

    for (const id of allIds) {
      const nodeA = graphA.nodes[id];
      const nodeB = graphB.nodes[id];

      if (!nodeA && nodeB) {
        added.push({
          id,
          change_metadata: {
            change_type: "ADDED",
            timestamp: Date.now(),
            source: this.sourceIdentifier,
          },
          new_data: nodeB.data,
        });
        continue;
      }

      if (nodeA && !nodeB) {
        removed.push({
          id,
          change_metadata: {
            change_type: "REMOVED",
            timestamp: Date.now(),
            source: this.sourceIdentifier,
          },
          old_data: nodeA.data,
        });
        continue;
      }

      if (nodeA && nodeB) {
        const hashA = this.calculateHash(nodeA.data);
        const hashB = this.calculateHash(nodeB.data);

        if (hashA !== hashB) {
          modified.push({
            id,
            change_metadata: {
              change_type: "MODIFIED",
              timestamp: Date.now(),
              source: this.sourceIdentifier,
            },
            old_data: nodeA.data,
            new_data: nodeB.data,
          });
        }
      }
    }
    return { added, removed, modified };
  }

  private compareEdges(
    graphA: GraphPayload,
    graphB: GraphPayload,
  ): {
    added: EdgeDiff[];
    removed: EdgeDiff[];
    modified: EdgeDiff[];
  } {
    const allIds = new Set<string>([
      ...Object.keys(graphA.edges),
      ...Object.keys(graphB.edges),
    ]);

    const added: EdgeDiff[] = [];
    const removed: EdgeDiff[] = [];
    const modified: EdgeDiff[] = [];

    for (const id of allIds) {
      const edgeA = graphA.edges[id];
      const edgeB = graphB.edges[id];

      if (!edgeA && edgeB) {
        added.push({
          id,
          change_metadata: {
            change_type: "ADDED",
            timestamp: Date.now(),
            source: this.sourceIdentifier,
          },
          new_metadata: edgeB.metadata,
        });
        continue;
      }

      if (edgeA && !edgeB) {
        removed.push({
          id,
          change_metadata: {
            change_type: "REMOVED",
            timestamp: Date.now(),
            source: this.sourceIdentifier,
          },
          old_metadata: edgeA.metadata,
        });
        continue;
      }

      if (edgeA && edgeB) {
        const hashA = this.calculateHash(edgeA.metadata);
        const hashB = this.calculateHash(edgeB.metadata);

        if (hashA !== hashB) {
          modified.push({
            id,
            change_metadata: {
              change_type: "MODIFIED",
              timestamp: Date.now(),
              source: this.sourceIdentifier,
            },
            old_metadata: edgeA.metadata,
            new_metadata: edgeB.metadata,
          });
        }
      }
    }
    return { added, removed, modified };
  }

  public diffGraphs(
    graphA: GraphPayload,
    graphB: GraphPayload,
  ): ContextGraphDiff {
    const nodeDiffs = this.compareNodes(graphA, graphB);
    const edgeDiffs = this.compareEdges(graphA, graphB);

    return {
      node_diffs: [...nodeDiffs.added, ...nodeDiffs.removed, ...nodeDiffs.modified],
      edge_diffs: [...edgeDiffs.added, ...edgeDiffs.removed, ...edgeDiffs.modified],
    };
  }
}