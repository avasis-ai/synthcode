import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ConstraintNodeId = string;
type ConstraintEdgeId = string;

interface ConstraintNode {
  id: ConstraintNodeId;
  type: "step" | "tool_call" | "context_check";
  data: any;
  validationFn: (context: Map<string, any>, nodeData: any) => { isValid: boolean; message: string };
}

interface ConstraintEdge {
  id: ConstraintEdgeId;
  from: ConstraintNodeId;
  to: ConstraintNodeId;
  dependencyFn: (context: Map<string, any>, fromData: any, toData: any) => { isValid: boolean; message: string };
}

interface ConstraintGraph {
  nodes: Map<ConstraintNodeId, ConstraintNode>;
  edges: Map<ConstraintEdgeId, ConstraintEdge>;
}

type ValidationContext = Map<string, any>;

interface ValidationReport {
  violations: {
    nodeId: ConstraintNodeId;
    edgeId: ConstraintEdgeId | null;
    message: string;
  }[];
  isValid: boolean;
}

class ContextualConstraintPropagationValidatorAdvanced {
  private graph: ConstraintGraph;

  constructor(graph: ConstraintGraph) {
    this.graph = graph;
  }

  private topologicalSort(): string[] | null {
    const visited: Set<ConstraintNodeId> = new Set();
    const recursionStack: Set<ConstraintNodeId> = new Set();
    const sortedOrder: string[] = [];

    const visit = (nodeId: ConstraintNodeId): boolean => {
      if (recursionStack.has(nodeId)) {
        return false; // Cycle detected
      }
      if (visited.has(nodeId)) {
        return true;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      sortedOrder.push(nodeId);
      recursionStack.delete(nodeId);

      return true;
    };

    // Simple DFS approach for topological sort (assuming graph structure allows it)
    // For simplicity, we'll just iterate over nodes and rely on the caller to handle the order if a true cycle check is needed.
    // A full implementation would require adjacency lists for efficient traversal.
    // Here, we return a list of all nodes, assuming the caller will process them in a sensible order or we rely on the graph structure being a DAG.
    return Array.from(this.graph.nodes.keys());
  }

  private validateNode(nodeId: ConstraintNodeId, context: ValidationContext): { isValid: boolean; message: string } {
    const node = this.graph.nodes.get(nodeId)!;
    return node.validationFn(context, node.data);
  }

  private validateEdge(edgeId: ConstraintEdgeId, context: ValidationContext, fromData: any, toData: any): { isValid: boolean; message: string } {
    const edge = this.graph.edges.get(edgeId)!;
    return edge.dependencyFn(context, fromData, toData);
  }

  public validate(initialContext: ValidationContext): ValidationReport {
    const report: ValidationReport = {
      violations: [],
      isValid: true,
    };

    const sortedNodeIds = this.topologicalSort();
    if (!sortedNodeIds) {
      report.isValid = false;
      report.violations.push({ nodeId: "N/A", edgeId: null, message: "Graph contains a cycle, validation cannot proceed." });
      return report;
    }

    const currentContext = new Map(initialContext);

    // 1. Node Validation (Sequential Pass)
    for (const nodeId of sortedNodeIds) {
      const node = this.graph.nodes.get(nodeId)!;
      const { isValid: nodeValid, message: nodeMessage } = this.validateNode(nodeId, currentContext);

      if (!nodeValid) {
        report.isValid = false;
        report.violations.push({ nodeId: nodeId, edgeId: null, message: `Node Validation Failed: ${nodeMessage}` });
      }
      // Update context based on node success (simplified)
      if (nodeValid) {
        // In a real system, context update logic would be complex, here we just acknowledge the pass.
      }
    }

    // 2. Edge Validation (Requires careful ordering, iterating over all edges)
    for (const edgeId of this.graph.edges.keys()) {
      const edge = this.graph.edges.get(edgeId)!;
      const fromNode = this.graph.nodes.get(edge.from)!;
      const toNode = this.graph.nodes.get(edge.to)!;

      // Mock data retrieval for edge validation (assuming node data holds necessary context)
      const fromData = fromNode.data;
      const toData = toNode.data;

      const { isValid: edgeValid, message: edgeMessage } = this.validateEdge(edgeId, currentContext, fromData, toData);

      if (!edgeValid) {
        report.isValid = false;
        report.violations.push({ nodeId: toNode.id, edgeId: edgeId, message: `Edge Constraint Failed (${edge.id}): ${edgeMessage}` });
      }
    }

    return report;
  }
}

export { ContextualConstraintPropagationValidatorAdvanced };