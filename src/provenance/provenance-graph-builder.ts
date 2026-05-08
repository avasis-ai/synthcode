import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./synth-code-types";

type SourceId = string;
type NodeId = string;
type ConfidenceScore = number;

interface TransformationDetails {
  agentId: string;
  description: string;
  toolName?: string;
}

interface ProvenanceNode {
  nodeId: NodeId;
  sourceId: SourceId;
  timestamp: number;
  confidence: ConfidenceScore;
  transformation: TransformationDetails;
  parentNodes: NodeId[];
}

export class ProvenanceGraphBuilder {
  private graph: Map<NodeId, ProvenanceNode>;

  constructor() {
    this.graph = new Map<NodeId, ProvenanceNode>();
  }

  addSource(
    data: unknown,
    sourceId: SourceId,
    initialConfidence: ConfidenceScore,
    nodeId: NodeId = `source-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  ): ProvenanceNode {
    const node: ProvenanceNode = {
      nodeId: nodeId,
      sourceId: sourceId,
      timestamp: Date.now(),
      confidence: initialConfidence,
      transformation: {
        agentId: "System",
        description: "Initial data source ingestion",
      },
      parentNodes: [],
    };
    this.graph.set(nodeId, node);
    return node;
  }

  applyTransformation(
    nodeId: NodeId,
    transformationDetails: TransformationDetails,
    newConfidence: ConfidenceScore,
    parentNodeIds: NodeId[] = []
  ): ProvenanceNode {
    if (!this.graph.has(nodeId)) {
      throw new Error(`Node ID ${nodeId} not found in the graph.`);
    }

    const parentNode = this.graph.get(nodeId)!;

    const newNode: ProvenanceNode = {
      nodeId: `transform-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sourceId: parentNode.sourceId,
      timestamp: Date.now(),
      confidence: newConfidence,
      transformation: {
        agentId: transformationDetails.agentId,
        description: transformationDetails.description,
        toolName: transformationDetails.toolName,
      },
      parentNodes: [...parentNode.parentNodes, ...parentNodes, nodeId],
    };

    this.graph.set(newNode.nodeId, newNode);
    return newNode;
  }

  calculateTrustScore(nodeId: NodeId): number {
    const node = this.graph.get(nodeId);
    if (!node) {
      return 0;
    }

    // The trust score is calculated as the geometric mean (or product) of confidence scores
    // along the path from the source to the current node.
    // Since we are dealing with confidence (0 to 1), multiplication is appropriate.
    // We use the node's confidence as the starting point and multiply by the confidence
    // of all its direct parents (which represent the transformations leading to it).

    let cumulativeScore = 1.0;
    const queue: NodeId[] = [nodeId];
    const visited = new Set<NodeId>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentNode = this.graph.get(currentId)!;

      if (currentNode.parentNodes.length > 0) {
        // For simplicity and adherence to the 'path' concept, we assume the trust score
        // is the product of the confidence scores of all nodes in the path leading up to it.
        // Since the transformation step itself defines the confidence, we iterate through parents.
        for (const parentId of currentNode.parentNodes) {
          const parentNode = this.graph.get(parentId)!;
          cumulativeScore *= parentNode.confidence;
          queue.push(parentId);
        }
      }
    }

    // A simpler, more robust approach for path confidence:
    // Start at the node and multiply by the confidence of all its direct parents.
    let score = node.confidence;
    for (const parentId of node.parentNodes) {
      const parentNode = this.graph.get(parentId)!;
      score *= parentNode.confidence;
    }

    return score;
  }
}