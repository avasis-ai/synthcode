import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface TimeWindow {
  start: number;
  end: number;
}

interface ResourceLimit {
  resourceName: string;
  capacity: number;
}

export interface TemporalResourceConstraint {
  id: string;
  severity: Severity;
  description: string;
  timeWindow: TimeWindow;
  requiredResources: ResourceLimit[];
  sourceMessageId: string;
  timestamp: number;
}

interface PathNode {
  messageId: string;
  constraints: TemporalResourceConstraint[];
  children: PathNode[];
}

export class ContextualConstraintPropagatorV8 {
  private pathGraph: PathNode = {
    messageId: "root",
    constraints: [],
    children: [],
  };

  constructor(initialConstraints: TemporalResourceConstraint[] = []) {
    this.pathGraph.constraints = initialConstraints;
  }

  private mergeConstraints(constraints1: TemporalResourceConstraint[], constraints2: TemporalResourceConstraint[]): TemporalResourceConstraint[] {
    const mergedMap = new Map<string, TemporalResourceConstraint>();

    const processConstraints = (constraints: TemporalResourceConstraint[]) => {
      for (const constraint of constraints) {
        if (!mergedMap.has(constraint.id)) {
          mergedMap.set(constraint.id, constraint);
        } else {
          const existing = mergedMap.get(constraint.id)!;
          // Simple merge logic: take the one with higher severity or later timestamp
          if (constraint.severity === "CRITICAL" && existing.severity !== "CRITICAL") {
            mergedMap.set(constraint.id, constraint);
          } else if (constraint.timestamp > existing.timestamp) {
            mergedMap.set(constraint.id, constraint);
          }
        }
      }
    };

    processConstraints(constraints1);
    processConstraints(constraints2);

    return Array.from(mergedMap.values());
  }

  private traverseAndPropagate(node: PathNode, newConstraints: TemporalResourceConstraint[]): PathNode {
    const updatedNode: PathNode = {
      messageId: node.messageId,
      constraints: this.mergeConstraints([...node.constraints, ...newConstraints]),
      children: node.children.map(child => this.traverseAndPropagate(child, [])),
    };
    return updatedNode;
  }

  public propagate(
    messageHistory: Array<{ id: string; message: ContentBlock[]; source: string }>,
    newConstraints: TemporalResourceConstraint[]
  ): { graph: PathNode; actionableConstraints: TemporalResourceConstraint[] } {
    let currentGraph: PathNode = {
      messageId: "root",
      constraints: [],
      children: [],
    };

    let currentNode: PathNode = currentGraph;

    for (const { id: messageId, message: messageBlocks, source } of messageHistory) {
      const pathConstraints: TemporalResourceConstraint[] = [];
      const childNodes: PathNode[] = [];

      // 1. Process message content to derive potential new constraints
      for (const block of messageBlocks) {
        if (block.type === "tool_use") {
          const toolUseBlock = block as ToolUseBlock;
          // Simulate constraint generation based on tool use
          pathConstraints.push({
            id: `${messageId}-tool-${toolUseBlock.id}`,
            severity: "HIGH",
            description: `Tool ${toolUseBlock.name} execution required.`,
            timeWindow: { start: Date.now(), end: Date.now() + 5000 },
            requiredResources: [{ resourceName: "CPU", capacity: 1 }],
            sourceMessageId: messageId,
            timestamp: Date.now(),
          });
        }
        // Add logic for other block types if necessary
      }

      // 2. Create a new branch (child node) representing this message
      const newNode: PathNode = {
        messageId: messageId,
        constraints: pathConstraints,
        children: [],
      };
      
      // 3. Propagate constraints from parent to child
      const propagatedNode = this.traverseAndPropagate(newNode, newConstraints);
      
      // Update the current node's children list
      currentNode.children = [...currentNode.children, propagatedNode];
      
      // The new node becomes the context for the next iteration (simplification for linear path)
      currentNode = propagatedNode;
    }

    // 4. Conflict Resolution Layer
    const allConstraints = this.collectAllConstraints(currentGraph);
    const actionableConstraints = this.resolveConflicts(allConstraints);

    return {
      graph: currentGraph,
      actionableConstraints: actionableConstraints,
    };
  }

  private collectAllConstraints(node: PathNode): TemporalResourceConstraint[] {
    let constraints: TemporalResourceConstraint[] = [...node.constraints];
    for (const child of node.children) {
      constraints = constraints.concat(this.collectAllConstraints(child));
    }
    return constraints;
  }

  private resolveConflicts(constraints: TemporalResourceConstraint[]): TemporalResourceConstraint[] {
    const conflictMap = new Map<string, TemporalResourceConstraint>();

    for (const constraint of constraints) {
      const existing = conflictMap.get(constraint.id);
      if (!existing) {
        conflictMap.set(constraint.id, constraint);
      } else {
        // Conflict Resolution Logic: Prioritize based on Severity > Recency
        if (constraint.severity === "CRITICAL" && existing.severity !== "CRITICAL") {
          conflictMap.set(constraint.id, constraint);
        } else if (constraint.timestamp > existing.timestamp) {
          conflictMap.set(constraint.id, constraint);
        }
      }
    }

    // Final prioritization: Sort by Severity (CRITICAL first) then by Timestamp (newest first)
    const sortedConstraints = Array.from(conflictMap.values()).sort((a, b) => {
      const severityOrder: Record<Severity, number> = {
        "CRITICAL": 4,
        "HIGH": 3,
        "MEDIUM": 2,
        "LOW": 1,
      };
      if (severityOrder[b.severity] !== severityOrder[a.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.timestamp - a.timestamp;
    });

    return sortedConstraints;
  }
}