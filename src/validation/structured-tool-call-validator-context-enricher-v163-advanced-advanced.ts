import { Message, ContentBlock, ToolUseBlock } from "./types";

export interface EnrichedContext {
  messages: Message[];
  toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
  dependencies: Map<string, { requiredBy: string; resolved: boolean }>;
  temporalConstraints: Map<string, { requiredAt: number; satisfied: boolean }>;
}

export interface ToolCallDependency {
  requiredToolCallId: string;
  dependencyType: "output_available" | "input_required";
}

export interface ToolCallTemporalConstraint {
  requiredAfterCallId: string;
  minimumDelaySeconds: number;
}

export class StructuredToolCallValidatorContextEnricher {
  private readonly initialContext: EnrichedContext;

  constructor(context: EnrichedContext) {
    this.initialContext = context;
  }

  enrich(
    proposedToolCalls: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    }[],
    dependencies: ToolCallDependency[],
    temporalConstraints: ToolCallTemporalConstraint[]
  ): {
    enrichedContext: EnrichedContext;
    validationErrors: string[];
  } {
    const enrichedContext: EnrichedContext = {
      messages: this.initialContext.messages,
      toolCalls: [...this.initialContext.toolCalls, ...proposedToolCalls],
      dependencies: new Map(this.initialContext.dependencies),
      temporalConstraints: new Map(this.initialContext.temporalConstraints),
    };

    const errors: string[] = [];

    // 1. Process Dependencies
    for (const dep of dependencies) {
      const dependencyKey = `${dep.requiredToolCallId}-${dep.dependencyType}`;
      if (!enrichedContext.dependencies.has(dependencyKey)) {
        enrichedContext.dependencies.set(dependencyKey, {
          requiredBy: dep.requiredToolCallId,
          resolved: false,
        });
      }
    }

    // 2. Process Temporal Constraints
    for (const tc of temporalConstraints) {
      const constraintKey = `${tc.requiredAfterCallId}-${tc.minimumDelaySeconds}`;
      if (!enrichedContext.temporalConstraints.has(constraintKey)) {
        enrichedContext.temporalConstraints.set(constraintKey, {
          requiredAt: tc.minimumDelaySeconds,
          satisfied: false,
        });
      }
    }

    // 3. Cross-Tool Call Dependency and Temporal Conflict Resolution (Simplified Simulation)
    // In a real system, this would involve state tracking across the sequence.
    // Here, we simulate checking if dependencies/constraints are met by the *current* proposed set.

    const proposedToolCallIds = proposedToolCalls.map(tc => tc.id);

    for (const dep of dependencies) {
      const dependencyKey = `${dep.requiredToolCallId}-${dep.dependencyType}`;
      const dependencyEntry = enrichedContext.dependencies.get(dependencyKey)!;

      if (!proposedToolCallIds.includes(dep.requiredToolCallId)) {
        errors.push(`Dependency check failed: Tool call ${dep.requiredToolCallId} is required but not present in the proposed sequence.`);
        continue;
      }

      // Simulate checking if the dependency is met by the context *before* this step
      // For simplicity, we assume if it's listed, it needs to be resolved by the end of the step.
      // A real implementation would check the history.
      if (dependencyEntry.resolved === false) {
        errors.push(`Dependency unmet: Tool call ${dep.requiredToolCallId} requires ${dep.dependencyType} output, which is not yet resolved.`);
      }
    }

    for (const tc of temporalConstraints) {
      const constraintKey = `${tc.requiredAfterCallId}-${tc.minimumDelaySeconds}`;
      const constraintEntry = enrichedContext.temporalConstraints.get(constraintKey)!;

      // Simulate checking if the time gap is plausible given the sequence
      if (constraintEntry.satisfied === false) {
        errors.push(`Temporal conflict: Tool call ${tc.requiredAfterCallId} must occur at least ${tc.minimumDelaySeconds} seconds after the preceding action, but this constraint is not satisfied.`);
      }
    }

    return {
      enrichedContext: enrichedContext,
      validationErrors: errors,
    };
  }
}