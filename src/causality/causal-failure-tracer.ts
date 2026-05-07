import { Message, ToolResultMessage } from "./types.js";

type DependencyNodeId = string;

interface DependencyEdge {
  source: DependencyNodeId;
  target: DependencyNodeId;
  dependencyType: "data" | "state" | "resource";
  weight: number;
}

interface DependencyNode {
  id: DependencyNodeId;
  description: string;
  associatedEvent: Message | null;
  constraints: string[];
  failurePotential: number;
}

export interface ContextualDependencyGraph {
  nodes: Map<DependencyNodeId, DependencyNode>;
  edges: DependencyEdge[];
}

export interface FailureEvent {
  id: string;
  message: string;
  severity: "CRITICAL" | "ERROR" | "WARNING";
  failedNodeId: DependencyNodeId;
  timestamp: number;
}

export interface CausalFactor {
  factor: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  suggestedRemediation: string;
}

export interface FailurePathStep {
  nodeId: DependencyNodeId;
  description: string;
  actionTaken: string;
}

export interface CausalFailureReport {
  rootCause: {
    factor: string;
    description: string;
    suggestedRemediation: string;
  };
  contributingFactors: CausalFactor[];
  failurePath: FailurePathStep[];
  overallSeverity: "CRITICAL" | "ERROR" | "WARNING";
}

export class CausalFailureTracer {
  private graph: ContextualDependencyGraph;

  constructor(graph: ContextualDependencyGraph) {
    this.graph = graph;
  }

  public trace(failureEvent: FailureEvent): CausalFailureReport {
    const failedNodeId = failureEvent.failedNodeId;

    const rootCause = this.analyzeRootCause(failedNodeId);
    const contributingFactors = this.identifyContributingFactors(failedNodeId);
    const failurePath = this.reconstructFailurePath(failedNodeId, failureEvent);

    return {
      rootCause: {
        factor: rootCause.factor,
        description: rootCause.description,
        suggestedRemediation: rootCause.suggestedRemediation,
      },
      contributingFactors: contributingFactors,
      failurePath: failurePath,
      overallSeverity: failureEvent.severity === "CRITICAL" ? "CRITICAL" : "ERROR",
    };
  }

  private analyzeRootCause(failedNodeId: DependencyNodeId): { factor: string; description: string; suggestedRemediation: string } {
    const failedNode = this.graph.nodes.get(failedNodeId);
    if (!failedNode) {
      return { factor: "Unknown", description: "Node not found.", suggestedRemediation: "Check graph integrity." };
    }

    const highestPotentialNodeId = this.findHighestPotentialNode(failedNodeId);
    const rootNode = this.graph.nodes.get(highestPotentialNodeId)!;

    return {
      factor: `State Discrepancy in ${rootNode.id}`,
      description: `The failure likely originated from an unvalidated state or constraint violation at node ${rootNode.id}. Constraints violated: ${rootNode.constraints.join(", ")}`,
      suggestedRemediation: "Review input validation logic and state transition guards for this node.",
    };
  }

  private identifyContributingFactors(failedNodeId: DependencyNodeId): CausalFactor[] {
    const factors: CausalFactor[] = [];
    const failedNode = this.graph.nodes.get(failedNodeId)!;

    // Check constraints
    failedNode.constraints.forEach(constraint => {
      factors.push({
        factor: `Constraint Violation: ${constraint}`,
        severity: "HIGH",
        description: `The execution failed because a required constraint (${constraint}) was not met by the input data or state.`,
        suggestedRemediation: "Implement stricter input validation or pre-check mechanisms.",
      });
    });

    // Check resource limitations (simplified)
    const resourceEdges = this.graph.edges.filter(e => e.dependencyType === "resource" && e.target === failedNodeId);
    if (resourceEdges.length > 0) {
      factors.push({
        factor: "Resource Exhaustion",
        severity: "MEDIUM",
        description: `Multiple dependencies suggest potential resource limitations leading up to this failure.`,
        suggestedRemediation: "Monitor resource usage (memory, API limits) in the execution context.",
      });
    }

    return factors;
  }

  private reconstructFailurePath(failedNodeId: DependencyNodeId, failureEvent: FailureEvent): FailurePathStep[] {
    const path: FailurePathStep[] = [];
    let currentNodeId: DependencyNodeId | null = failedNodeId;

    // Simple backward traversal: follow edges backward until a starting point or depth limit is reached.
    while (currentNodeId) {
      const node = this.graph.nodes.get(currentNodeId)!;
      path.unshift({
        nodeId: currentNodeId,
        description: node.description,
        actionTaken: node.associatedEvent ? `Processed message: ${node.associatedEvent.content}` : "Initial setup/context load.",
      });

      // Find the source of the dependency that led to this node
      const precedingEdges = this.graph.edges.filter(e => e.target === currentNodeId);
      if (precedingEdges.length > 0) {
        // Just pick the first source for simplicity in path reconstruction
        currentNodeId = precedingEdges[0].source;
      } else {
        currentNodeId = null;
      }
    }
    return path;
  }

  private findHighestPotentialNode(failedNodeId: DependencyNodeId): DependencyNodeId {
    let maxPotential = -1;
    let bestNodeId: DependencyNodeId = failedNodeId;

    // Check all nodes that feed into the failed node
    const relevantEdges = this.graph.edges.filter(e => e.target === failedNodeId);

    for (const edge of relevantEdges) {
      const sourceNode = this.graph.nodes.get(edge.source)!;
      if (sourceNode.failurePotential > maxPotential) {
        maxPotential = sourceNode.failurePotential;
        bestNodeId = edge.source;
      }
    }
    return bestNodeId;
  }
}