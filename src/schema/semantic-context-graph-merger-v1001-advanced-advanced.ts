import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type GraphSource = {
  messages: Message[];
  source_id: string;
  credibility_score: number;
  timestamp: number;
};

interface SemanticGraph {
  nodes: Map<string, {
    id: string;
    label: string;
    attributes: Record<string, any>;
    source_evidence: {
      source_id: string;
      timestamp: number;
    }[];
  }>;
  edges: Map<string, {
    source_id: string;
    target_id: string;
    relationship: string;
    attributes: Record<string, any>;
    source_evidence: {
      source_id: string;
      timestamp: number;
    }[];
  }>;
}

class SemanticContextGraphMerger {
  private mergeNode(
    existingNode: {
      id: string;
      label: string;
      attributes: Record<string, any>;
      source_evidence: {
        source_id: string;
        timestamp: number;
      }[];
    },
    newNode: {
      id: string;
      label: string;
      attributes: Record<string, any>;
      source_evidence: {
        source_id: string;
        timestamp: number;
      }[];
    },
    source: GraphSource
  ): {
    node: {
      id: string;
      label: string;
      attributes: Record<string, any>;
      source_evidence: {
        source_id: string;
        timestamp: number;
      }[];
    };
    merged: boolean;
  } {
    const merged = false;
    const newEvidence = {
      source_id: source.source_id,
      timestamp: source.timestamp,
    };

    const updatedAttributes: Record<string, any> = {
      ...existingNode.attributes,
    };

    const updatedEvidence: {
      source_id: string;
      timestamp: number;
    }[] = [
      ...existingNode.source_evidence,
      newEvidence,
    ].sort((a, b) => b.timestamp - a.timestamp);

    // Simple conflict resolution: favor the attribute from the source with higher credibility
    // or the most recent one if credibility is equal.
    const resolveAttributeConflict = (
      key: string,
      existingValue: any,
      newValue: any
    ): any => {
      if (typeof existingValue === 'object' && existingValue !== null && typeof newValue === 'object' && newValue !== null) {
        return { existing: existingValue, new: newValue };
      }
      if (typeof existingValue === 'string' && typeof newValue === 'string') {
        return newValue; // Simple overwrite for strings, assuming new is more specific
      }
      return newValue;
    };

    const finalAttributes: Record<string, any> = {};
    for (const key in existingNode.attributes) {
      const existingValue = existingNode.attributes[key];
      const newValue = newNode.attributes[key];

      if (newValue !== undefined) {
        finalAttributes[key] = resolveAttributeConflict(key, existingValue, newValue);
      } else {
        finalAttributes[key] = existingValue;
      }
    }

    return {
      node: {
        id: existingNode.id,
        label: existingNode.label,
        attributes: finalAttributes,
        source_evidence: updatedEvidence,
      },
      merged: true,
    };
  }

  private mergeEdge(
    existingEdge: {
      source_id: string;
      target_id: string;
      relationship: string;
      attributes: Record<string, any>;
      source_evidence: {
        source_id: string;
        timestamp: number;
      }[];
    },
    newEdge: {
      source_id: string;
      target_id: string;
      relationship: string;
      attributes: Record<string, any>;
      source_evidence: {
        source_id: string;
        timestamp: number;
      }[];
    },
    source: GraphSource
  ): {
    edge: {
      source_id: string;
      target_id: string;
      relationship: string;
      attributes: Record<string, any>;
      source_evidence: {
        source_id: string;
        timestamp: number;
      }[];
    };
    merged: boolean;
  } {
    const merged = false;
    const newEvidence = {
      source_id: source.source_id,
      timestamp: source.timestamp,
    };

    const updatedAttributes: Record<string, any> = {
      ...existingEdge.attributes,
    };

    const updatedEvidence: {
      source_id: string;
      timestamp: number;
    }[] = [
      ...existingEdge.source_evidence,
      newEvidence,
    ].sort((a, b) => b.timestamp - a.timestamp);

    const finalAttributes: Record<string, any> = {};
    for (const key in existingEdge.attributes) {
      const existingValue = existingEdge.attributes[key];
      const newValue = newEdge.attributes[key];

      if (newValue !== undefined) {
        finalAttributes[key] = (
          typeof existingValue === 'string' && typeof newValue === 'string'
        ) ? newValue : existingValue;
      } else {
        finalAttributes[key] = existingValue;
      }
    }

    return {
      edge: {
        source_id: existingEdge.source_id,
        target_id: existingEdge.target_id,
        relationship: existingEdge.relationship,
        attributes: finalAttributes,
        source_evidence: updatedEvidence,
      },
      merged: true,
    };
  }

  public merge(sources: GraphSource[]): SemanticGraph {
    let mergedNodes = new Map<string, {
      id: string;
      label: string;
      attributes: Record<string, any>;
      source_evidence: {
        source_id: string;
        timestamp: number;
      }[];
    }>();

    let mergedEdges = new Map<string, {
      source_id: string;
      target_id: string;
      relationship: string;
      attributes: Record<string, any>;
      source_evidence: {
        source_id: string;
        timestamp: number;
      }[];
    }>();

    for (const source of sources) {
      // Simulate node merging from source (assuming source provides a structure)
      const sourceNodes: {
        id: string;
        label: string;
        attributes: Record<string, any>;
        source_evidence: {
          source_id: string;
          timestamp: number;
        }[];
      }[] = source.messages.map((msg, index) => ({
        id: `node_${source.source_id}_${index}`,
        label: msg.role === "user" ? "User" : "System",
        attributes: { content: msg.content || "" },
        source_evidence: [{
          source_id: source.source_id,
          timestamp: source.timestamp,
        }],
      }));

      for (const node of sourceNodes) {
        const existingNode = mergedNodes.get(node.id);
        if (existingNode) {
          const { node: mergedNode, merged: _ } = this.mergeNode(
            existingNode,
            node,
            source
          );
          mergedNodes.set(node.id, mergedNode.node);
        } else {
          mergedNodes.set(node.id, node);
        }
      }

      // Simulate edge merging from source
      const sourceEdges: {
        source_id: string;
        target_id: string;
        relationship: string;
        attributes: Record<string, any>;
        source_evidence: {
          source_id: string;
          timestamp: number;
        }[];
      }[] = []; // Placeholder for actual edge extraction

      for (const edge of sourceEdges) {
        const existingEdge = mergedEdges.get(`${edge.source_id}->${edge.target_id}`);
        if (existingEdge) {
          const { edge: mergedEdge, merged: _ } = this.mergeEdge(
            existingEdge,
            edge,
            source
          );
          mergedEdges.set(`${edge.source_id}->${edge.target_id}`, mergedEdge.edge);
        } else {
          mergedEdges.set(`${edge.source_id}->${edge.target_id}`, edge);
        }
      }
    }

    return {
      nodes: mergedNodes,
      edges: mergedEdges,
    };
  }
}

export { SemanticContextGraphMerger };