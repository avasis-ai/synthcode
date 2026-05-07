import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ResourceName = string;
export type ResourceValue = number;

export interface GlobalState {
  currentTime: number;
  availableResources: Record<ResourceName, ResourceValue>;
  capabilities: Set<string>;
}

export interface PlanStep {
  type: "tool_call" | "resource_request" | "state_transition";
  details: any;
}

export interface ToolCallDetails {
  toolName: string;
  input: Record<string, unknown>;
}

export interface ResourceRequestDetails {
  resource: ResourceName;
  amount: ResourceValue;
  duration: number;
}

export interface StateTransitionDetails {
  stateKey: string;
  newValue: any;
}

export type PlanStepDetails =
  | ToolCallDetails
  | ResourceRequestDetails
  | StateTransitionDetails;

export interface SimulationPlan {
  steps: PlanStepDetails[];
}

export interface Conflict {
  stepIndex: number;
  stepType: string;
  message: string;
  severity: "CRITICAL" | "WARNING";
}

export interface SimulationReport {
  conflicts: Conflict[];
  warnings: Conflict[];
  predictedFinalState: GlobalState;
  summary: string;
}

class PredictiveConstraintSimulator {
  private currentState: GlobalState;

  constructor(initialState: GlobalState) {
    this.currentState = initialState;
  }

  private validateStep(step: PlanStepDetails, stepIndex: number, currentState: GlobalState): { conflict: Conflict | null, newState: GlobalState } {
    let conflict: Conflict | null = null;
    let nextState: GlobalState = { ...currentState };

    if (step.type === "tool_call") {
      const details = step as unknown as { type: "tool_call", details: ToolCallDetails };
      if (!currentState.capabilities.has(details.details.toolName)) {
        conflict = {
          stepIndex,
          stepType: "tool_call",
          message: `Capability mismatch: Tool '${details.details.toolName}' is not available.`,
          severity: "CRITICAL",
        };
      }
      // Simulate state change based on successful tool call (e.g., updating knowledge base)
      nextState.currentTime += 1;

    } else if (step.type === "resource_request") {
      const details = step as unknown as { type: "resource_request", details: ResourceRequestDetails };
      const { resource, amount, duration } = details.details;

      if (currentState.availableResources[resource] < amount) {
        conflict = {
          stepIndex,
          stepType: "resource_request",
          message: `Resource overrun: Insufficient ${resource}. Needed ${amount}, available ${currentState.availableResources[resource]}.`,
          severity: "CRITICAL",
        };
      } else {
        // Simulate resource consumption
        nextState.availableResources = {
          ...currentState.availableResources,
          [resource]: currentState.availableResources[resource] - amount,
        };
        nextState.currentTime += duration;
      }

    } else if (step.type === "state_transition") {
      const details = step as unknown as { type: "state_transition", details: StateTransitionDetails };
      const { stateKey, newValue } = details.details;

      // Simple validation: check if the transition is logically sound
      if (typeof newValue !== "string" && typeof newValue !== "number") {
        conflict = {
          stepIndex,
          stepType: "state_transition",
          message: `Invalid state value type for '${stateKey}'. Expected string or number.`,
          severity: "WARNING",
        };
      }
      // Simulate state update
      nextState.capabilities.add(stateKey);
    }

    return { conflict, newState: nextState };
  }

  public simulate(plan: SimulationPlan): SimulationReport {
    let currentGlobalState = {
      currentTime: this.currentState.currentTime,
      availableResources: { ...this.currentState.availableResources },
      capabilities: new Set(this.currentState.capabilities),
    };

    const conflicts: Conflict[] = [];
    const warnings: Conflict[] = [];
    let currentState = currentGlobalState;

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const { conflict, newState } = this.validateStep(step, i, currentState);

      if (conflict) {
        if (conflict.severity === "CRITICAL") {
          conflicts.push(conflict);
        } else {
          warnings.push(conflict);
        }
      }
      // Update state for the next iteration, even if a conflict occurred,
      // unless the conflict is critical and prevents progress (simplified here).
      currentState = newState;
    }

    return {
      conflicts: conflicts,
      warnings: warnings,
      predictedFinalState: currentState,
      summary: `Simulation completed. Found ${conflicts.length} critical conflicts and ${warnings.length} warnings.`,
    };
  }
}

export { PredictiveConstraintSimulator };