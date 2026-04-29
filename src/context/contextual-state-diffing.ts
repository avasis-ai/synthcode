import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface Context {
  messages: Message[];
  knowledgeGraph: Map<string, any>;
  constraints: Record<string, any>;
  metadata: Record<string, any>;
}

export type DiffOperation = "added" | "removed" | "updated";

export interface FieldDiff<T> {
  operation: DiffOperation;
  oldValue: T | undefined;
  newValue: T | undefined;
}

export interface GraphDiff {
  addedEdges: { from: string; to: string; relationship: string; payload: any }[];
  removedEdges: { from: string; to: string; relationship: string }[];
  updatedNodes: Record<string, { changes: Record<string, any> }>;
}

export interface ContextDiff {
  messages: {
    diff: {
      operation: DiffOperation;
      oldMessage: Message | undefined;
      newMessage: Message | undefined;
    }[];
  };
  knowledgeGraph: GraphDiff;
  constraints: Record<string, FieldDiff<any>>;
  metadata: Record<string, FieldDiff<any>>;
}

export class ContextDiffService {
  diff(oldContext: Context, newContext: Context): ContextDiff {
    const messageDiffs = this.diffMessages(oldContext.messages, newContext.messages);
    const graphDiff = this.diffKnowledgeGraph(oldContext.knowledgeGraph, newContext.knowledgeGraph);
    const constraintDiffs = this.diffRecord(oldContext.constraints, newContext.constraints);
    const metadataDiffs = this.diffRecord(oldContext.metadata, newContext.metadata);

    return {
      messages: { diff: messageDiffs },
      knowledgeGraph: graphDiff,
      constraints: constraintDiffs,
      metadata: metadataDiffs,
    };
  }

  private diffMessages(oldMessages: Message[], newMessages: Message[]): {
    diff: {
      operation: DiffOperation;
      oldMessage: Message | undefined;
      newMessage: Message | undefined;
    }[];
  } {
    const oldMap = new Map<string, Message>();
    oldMessages.forEach((msg, index) => oldMap.set(index.toString(), msg));

    const newMap = new Map<string, Message>();
    newMessages.forEach((msg, index) => newMap.set(index.toString(), msg));

    const diff: {
      operation: DiffOperation;
      oldMessage: Message | undefined;
      newMessage: Message | undefined;
    }[] = [];

    const allIndices = new Set<string>();
    [...oldMap.keys(), ...newMap.keys()].forEach(key => allIndices.add(key));

    allIndices.forEach(indexKey => {
      const oldMsg = oldMap.get(indexKey);
      const newMsg = newMap.get(indexKey);

      if (oldMsg && !newMsg) {
        diff.push({ operation: "removed", oldMessage: oldMsg, newMessage: undefined });
      } else if (!oldMsg && newMsg) {
        diff.push({ operation: "added", oldMessage: undefined, newMessage: newMsg });
      } else if (oldMsg && newMsg) {
        // Simple content comparison for demonstration; real diff would be deeper
        if (JSON.stringify(oldMsg) !== JSON.stringify(newMsg)) {
          diff.push({ operation: "updated", oldMessage: oldMsg, newMessage: newMsg });
        }
      }
    });

    return { diff };
  }

  private diffKnowledgeGraph(oldGraph: Map<string, any>, newGraph: Map<string, any>): GraphDiff {
    const addedEdges: { from: string; to: string; relationship: string; payload: any }[] = [];
    const removedEdges: { from: string; to: string; relationship: string }[] = [];
    const updatedNodes: Record<string, { changes: Record<string, any> }> = {};

    // Simplified: Assume nodes are keys in the map for simplicity
    const oldNodes = Array.from(oldGraph.keys());
    const newNodes = Array.from(newGraph.keys());

    // Node comparison (simplified)
    const allNodeKeys = new Set([...oldNodes, ...newNodes]);
    for (const nodeId of allNodeKeys) {
      const oldNode = oldGraph.get(nodeId);
      const newNode = newGraph.get(nodeId);

      if (oldNode && !newNode) {
        // Node removal handling would go here
      } else if (!oldNode && newNode) {
        // Node addition handling would go here
      } else if (oldNode && newNode && JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
        // Deep comparison logic for node properties
        const changes: Record<string, any> = {};
        // Placeholder for actual property diffing
        if (typeof oldNode === 'object' && typeof newNode === 'object') {
            Object.keys(oldNode).forEach(key => {
                if (JSON.stringify(oldNode[key]) !== JSON.stringify(newNode[key])) {
                    changes[key] = { old: oldNode[key], new: newNode[key] };
                }
            });
        }
        if (Object.keys(changes).length > 0) {
            updatedNodes[nodeId] = { changes };
        }
      }
    }

    // Edge comparison (highly simplified, assuming edges are stored under a specific key or structure)
    // In a real scenario, we'd need a dedicated Edge structure.
    // Here, we just check for structural changes in the map values if they represent edges.
    // For this implementation, we assume edge changes are captured within node updates or are too complex for this scope.

    return {
      addedEdges: [],
      removedEdges: [],
      updatedNodes: updatedNodes,
    };
  }

  private diffRecord(oldRecord: Record<string, any>, newRecord: Record<string, any>): Record<string, FieldDiff<any>> {
    const diff: Record<string, FieldDiff<any>> = {};
    const allKeys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]);

    for (const key of allKeys) {
      const oldValue = oldRecord[key];
      const newValue = newRecord[key];

      if (oldValue === undefined && newValue !== undefined) {
        diff[key] = { operation: "added", oldValue: undefined, newValue: newValue };
      } else if (oldValue !== undefined && newValue === undefined) {
        diff[key] = { operation: "removed", oldValue: oldValue, newValue: undefined };
      } else if (oldValue !== undefined && newValue !== undefined && JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diff[key] = { operation: "updated", oldValue: oldValue, newValue: newValue };
      } else {
        // No change or both undefined
      }
    }
    return diff;
  }
}

export { ContextDiffService };