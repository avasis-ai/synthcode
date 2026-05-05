import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface CausalEdge {
  fromNodeId: string;
  toNodeId: string;
  causalWeight: number;
  timestamp: number;
}

interface CausalNode {
  id: string;
  state: any;
  timestamp: number;
  dependencies: string[];
}

export interface CausalStateDiffPayload {
  nodes: CausalNode[];
  edges: CausalEdge[];
  driftedNodeIds: string[];
  driftedEdgeIds: string[];
}

export class CausalStateDiffCalculator {
  private causalRules: Map<string, (currentState: any, previousState: any) => boolean>;

  constructor(causalRules: Map<string, (currentState: any, previousState: any) => boolean>) {
    this.causalRules = causalRules;
  }

  private buildStateGraph(snapshots: Message[]): {
    nodes: CausalNode[];
    edges: CausalEdge[];
  } {
    const nodes: CausalNode[] = [];
    const edges: CausalEdge[] = [];
    let nodeIdCounter = 0;

    snapshots.forEach((message, index) => {
      const nodeId = `node_${nodeIdCounter++}`;
      const node: CausalNode = {
        id: nodeId,
        state: message,
        timestamp: Date.now() + index * 1000,
        dependencies: [],
      };
      nodes.push(node);

      if (index > 0) {
        const previousNodeId = `node_${nodeIdCounter - 2}`;
        edges.push({
          fromNodeId: previousNodeId,
          toNodeId: nodeId,
          causalWeight: 1.0,
          timestamp: node.timestamp,
        });
      }
    });

    return { nodes, edges };
  }

  public calculateDiff(
    currentState: Message[],
    previousState: Message[],
  ): CausalStateDiffPayload {
    const { nodes: currentNodeNodes, edges: currentEdges } = this.buildStateGraph(currentState);
    const { nodes: previousNodes, edges: previousEdges } = this.buildStateGraph(previousState);

    const allNodesMap = new Map<string, CausalNode>();
    currentNodeNodes.forEach(node => allNodesMap.set(node.id, node));
    previousNodes.forEach(node => allNodesMap.set(node.id, node));

    const allEdgesMap = new Map<string, CausalEdge>();
    currentEdges.forEach(edge => allEdgesMap.set(`${edge.fromNodeId}-${edge.toNodeId}`, edge));
    previousEdges.forEach(edge => allEdgesMap.set(`${edge.fromNodeId}-${edge.toNodeId}`, edge));

    const driftedNodeIds: string[] = [];
    const driftedEdgeIds: string[] = [];

    for (const node of currentNodeNodes) {
      const previousNode = allNodesMap.get(node.id);
      if (!previousNode) continue;

      let isDrift = false;
      for (const [ruleKey, rule] of this.causalRules.entries()) {
        if (rule(node.state, previousNode.state)) {
          // Rule explains the change, no drift detected based on this rule
          isDrift = false;
          break;
        }
      }

      if (!isDrift) {
        driftedNodeIds.push(node.id);
      }
    }

    for (const edge of currentEdges) {
      const fromNode = allNodesMap.get(edge.fromNodeId);
      const toNode = allNodesMap.get(edge.toNodeId);

      if (!fromNode || !toNode) continue;

      // Simplified edge drift check: check if the transition itself violates causality
      let isEdgeDrift = true;
      for (const [ruleKey, rule] of this.causalRules.entries()) {
        if (rule(toNode.state, fromNode.state)) {
          isEdgeDrift = false;
          break;
        }
      }

      if (isEdgeDrift) {
        driftedEdgeIds.push(`${edge.fromNodeId}-${edge.toNodeId}`);
      }
    }

    return {
      nodes: currentNodeNodes,
      edges: currentEdges,
      driftedNodeIds,
      driftedEdgeIds,
    };
  }
}