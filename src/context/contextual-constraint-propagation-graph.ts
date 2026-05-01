import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ConstraintType = "temporal" | "resource" | "capability" | "logical";

interface Constraint {
  type: ConstraintType;
  source: string;
  description: string;
  severity: "low" | "medium" | "high";
  appliesTo: string;
}

interface ConstraintNode {
  constraint: Constraint;
  nodeId: string;
}

interface ConstraintEdge {
  fromNodeId: string;
  toNodeId: string;
  propagationRule: (c1: Constraint, c2: Constraint) => { merged: Constraint | null; conflict: boolean };
}

export class ContextualConstraintPropagationGraph {
  private nodes: Map<string, ConstraintNode> = new Map();
  private edges: Map<string, ConstraintEdge[]> = new Map();
  private contextHistory: Message[];

  constructor(initialContext: Message[] = []) {
    this.contextHistory = initialContext;
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private addNode(constraint: Constraint, sourceId: string): string {
    const nodeId = this.generateUniqueId();
    this.nodes.set(nodeId, { constraint, nodeId });
    return nodeId;
  }

  private addEdge(fromId: string, toId: string, rule: (c1: Constraint, c2: Constraint) => { merged: Constraint | null; conflict: boolean }): void {
    if (!this.edges.has(fromId)) {
      this.edges.set(fromId, []);
    }
    this.edges.get(fromId)!.push({
      fromNodeId: fromId,
      toNodeId: toId,
      propagationRule: rule,
    });
  }

  public ingestContext(messages: Message[]): void {
    this.contextHistory = messages;
    this.nodes.clear();
    this.edges.clear();

    let lastNodeId: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      let currentConstraints: Constraint[] = [];
      let sourceId = `msg_${i}`;

      if (message.role === "user") {
        currentConstraints.push({
          type: "logical",
          source: sourceId,
          description: `User intent: ${message.content.text}`,
          severity: "medium",
          appliesTo: "user_input",
        });
      } else if (message.role === "assistant") {
        for (const block of message.content) {
          if (block.type === "text") {
            currentConstraints.push({
              type: "logical",
              source: sourceId,
              description: `Assistant response text: ${block.text.text}`,
              severity: "low",
              appliesTo: "assistant_output",
            });
          }
        }
      }

      if (currentConstraints.length > 0) {
        const nodeId = this.addNode(currentConstraints[0], sourceId);
        if (lastNodeId) {
          // Simplified edge creation: assume all constraints from the previous step influence this one
          const rule: (c1: Constraint, c2: Constraint) => { merged: Constraint | null; conflict: boolean } = (c1, c2) => {
            const merged: Constraint | null = {
              type: "logical",
              source: "propagated",
              description: `Combined context from ${c1.source} and ${c2.source}`,
              severity: "medium",
              appliesTo: "context_flow",
            };
            const conflict: boolean = false;
            return { merged, conflict };
          };
          this.addEdge(lastNodeId, nodeId, rule);
        }
        lastNodeId = nodeId;
      }
    }
  }

  private traverseGraph(startNodeId: string): Constraint[] {
    const visited = new Set<string>();
    const constraints: Constraint[] = [];
    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        constraints.push(node.constraint);
      }

      const edges = this.edges.get(nodeId) || [];
      for (const edge of edges) {
        if (!visited.has(edge.toNodeId)) {
          queue.push(edge.toNodeId);
        }
      }
    }
    return constraints;
  }

  public getConstraintsAtPoint(targetNodeId: string | null): Constraint[] {
    if (!targetNodeId) return [];

    const influencingConstraints = this.traverseGraph(targetNodeId);
    return influencingConstraints;
  }

  public resolve(currentConstraints: Constraint[], nextAction: { type: "tool_call"; name: string; input: Record<string, unknown> }): { unifiedConstraints: Constraint[]; conflictDetected: boolean; suggestions: string[] } {
    let unifiedConstraints: Constraint[] = [...currentConstraints];
    let conflictDetected = false;
    const suggestions: string[] = [];

    // 1. Check for immediate conflicts based on the next action
    const actionConstraint: Constraint = {
      type: "capability",
      source: "next_action",
      description: `Requires capability for tool: ${nextAction.name}`,
      severity: "high",
      appliesTo: "tool_execution",
    };

    for (const existingConstraint of currentConstraints) {
      // Simplified conflict check: if existing constraint is 'resource' and action requires different resource
      if (existingConstraint.type === "resource" && actionConstraint.type === "capability") {
        if (existingConstraint.description.includes("limited")) {
          conflictDetected = true;
          suggestions.push(`Resource conflict detected: ${existingConstraint.description}. Consider adjusting resource allocation.`);
        }
      }
    }

    // 2. Aggregate and refine
    unifiedConstraints.push(actionConstraint);

    // In a real system, this would involve complex constraint satisfaction solving.
    // Here, we simulate refinement by merging descriptions.
    const refinedMap = new Map<string, Constraint>();
    for (const constraint of unifiedConstraints) {
      const key = `${constraint.type}:${constraint.appliesTo}`;
      if (!refinedMap.has(key) || constraint.severity > refinedMap.get(key)!.severity) {
        refinedMap.set(key, {
          ...constraint,
          description: `[Aggregated] ${constraint.description} (Source: ${constraint.source})`,
        });
      }
    }

    return {
      unifiedConstraints: Array.from(refinedMap.values()),
      conflictDetected,
      suggestions,
    };
  }
}