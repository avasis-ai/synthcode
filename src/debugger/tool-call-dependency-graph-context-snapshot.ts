import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface NodeState {
  nodeId: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: "pending" | "completed" | "failed";
}

export interface EdgeTraversal {
  fromNodeId: string;
  toNodeId: string;
  reason: string;
  timestamp: number;
}

export interface GraphContextSnapshot {
  nodeStates: Map<string, NodeState>;
  edgeTraversals: EdgeTraversal[];
  contextVariables: Map<string, unknown>;
  timestamp: number;
}

export class SnapshotManager {
  private currentSnapshot: GraphContextSnapshot | null = null;

  createSnapshot(
    nodeStates: Map<string, NodeState>,
    edgeTraversals: EdgeTraversal[],
    contextVariables: Map<string, unknown>
  ): GraphContextSnapshot {
    return {
      nodeStates: new Map(nodeStates),
      edgeTraversals: [...edgeTraversals],
      contextVariables: new Map(contextVariables),
      timestamp: Date.now(),
    };
  }

  setSnapshot(snapshot: GraphContextSnapshot): void {
    this.currentSnapshot = snapshot;
  }

  getSnapshot(): GraphContextSnapshot | null {
    return this.currentSnapshot;
  }

  restoreSnapshot(snapshot: GraphContextSnapshot): void {
    this.currentSnapshot = snapshot;
  }

  serializeSnapshot(): Record<string, any> {
    if (!this.currentSnapshot) {
      return { error: "No snapshot available" };
    }
    return {
      nodeStates: Object.fromEntries(
        [...this.currentSnapshot.nodeStates].map(([key, value]) => [key, value])
      ),
      edgeTraversals: this.currentSnapshot.edgeTraversals,
      contextVariables: Object.fromEntries(
        [...this.currentSnapshot.contextVariables].map(([key, value]) => [key, value])
      ),
      timestamp: this.currentSnapshot.timestamp,
    };
  }

  static deserializeSnapshot(data: Record<string, any>): GraphContextSnapshot {
    const nodeStates = new Map<string, NodeState>();
    (data.nodeStates as Record<string, NodeState>).forEach((state, nodeId) => {
      nodeStates.set(nodeId, state);
    });

    const contextVariables = new Map<string, unknown>();
    (data.contextVariables as Record<string, unknown>).forEach((value, key) => {
      contextVariables.set(key, value);
    });

    return {
      nodeStates: nodeStates,
      edgeTraversals: data.edgeTraversals || [],
      contextVariables: contextVariables,
      timestamp: data.timestamp || Date.now(),
    };
  }
}

export { SnapshotManager };