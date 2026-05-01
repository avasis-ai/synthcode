import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export type ConstraintType = "resource" | "temporal" | "capability" | "general";

export interface Constraint {
  type: ConstraintType;
  source: string;
  priority: number;
  details: Record<string, any>;
}

type ConstraintList = Constraint[];

export class ContextualConstraintMerger {
  private readonly conflictStrategy: 'most-restrictive-wins' | 'latest-source-wins' | 'priority-wins';

  constructor(conflictStrategy: 'most-restrictive-wins' | 'latest-source-wins' | 'priority-wins' = 'priority-wins') {
    this.conflictStrategy = conflictStrategy;
  }

  private resolveConflict(existing: Constraint, incoming: Constraint): Constraint {
    switch (this.conflictStrategy) {
      case 'most-restrictive-wins':
        if (existing.type === 'resource' && incoming.type === 'resource') {
          const existingValue = existing.details.value;
          const incomingValue = incoming.details.value;

          if (typeof existingValue === 'number' && typeof incomingValue === 'number') {
            return {
              type: 'resource',
              source: 'merged',
              priority: Math.max(existing.priority, incoming.priority),
              details: { value: Math.min(existingValue, incomingValue) },
            };
          }
        }
        // Fallback for other types or if resource comparison fails
        return incoming.priority > existing.priority ? incoming : existing;

      case 'latest-source-wins':
        // Simple heuristic: later source name wins (assuming lexicographical order implies recency)
        return incoming.source > existing.source ? incoming : existing;

      case 'priority-wins':
      default:
        return incoming.priority > existing.priority ? incoming : existing;
    }
  }

  public mergeConstraints(constraints: ConstraintList): ConstraintList {
    if (!constraints || constraints.length === 0) {
      return [];
    }

    const mergedMap = new Map<string, Constraint>();

    for (const constraint of constraints) {
      let found = false;
      for (const [key, existingConstraint] of mergedMap.entries()) {
        if (this.areConstraintsEquivalent(existingConstraint, constraint)) {
          const resolved = this.resolveConflict(existingConstraint, constraint);
          mergedMap.set(key, resolved);
          found = true;
          break;
        }
      }

      if (!found) {
        mergedMap.set(constraint.source + ':' + constraint.type, constraint);
      }
    }

    return Array.from(mergedMap.values());
  }

  private areConstraintsEquivalent(a: Constraint, b: Constraint): boolean {
    if (a.type !== b.type) return false;

    switch (a.type) {
      case 'resource':
        return a.details.key === b.details.key;
      case 'temporal':
        return a.details.rule === b.details.rule;
      case 'capability':
        return a.details.capability === b.details.capability;
      case 'general':
        return false; // Assume general constraints are unique enough or handled by source/priority
    }
  }
}