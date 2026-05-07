export type ResourceMap = Record<string, number>;

export interface CapabilityNode {
  capabilityId: string;
  requiredResources: ResourceMap;
  timeWindow: {
    start: number;
    end: number;
  };
  duration: number;
}

export interface DependencyResolverState {
  currentTime: number;
  availableResources: ResourceMap;
}

export class TemporalCapabilityDependencyResolver {
  private readonly initialResources: ResourceMap;

  constructor(initialResources: ResourceMap) {
    this.initialResources = initialResources;
  }

  private checkResourceAvailability(
    state: DependencyResolverState,
    node: CapabilityNode
  ): boolean {
    for (const resource in node.requiredResources) {
      const required = node.requiredResources[resource];
      const available = state.availableResources[resource] || 0;
      if (required > available) {
        return false;
      }
    }
    return true;
  }

  private calculateNextState(
    state: DependencyResolverState,
    node: CapabilityNode
  ): DependencyResolverState {
    const newTime = state.currentTime + node.duration;
    const newResources: ResourceMap = { ...state.availableResources };

    for (const resource in node.requiredResources) {
      const required = node.requiredResources[resource];
      newResources[resource] = (newResources[resource] || 0) - required;
    }

    return {
      currentTime: newTime,
      availableResources: newResources,
    };
  }

  /**
   * Checks if a sequence of capabilities is feasible given resource and temporal constraints.
   * @param capabilities The ordered sequence of capabilities to check.
   * @param initialState The starting state (time and resources).
   * @returns An object containing feasibility status and the final state if successful.
   */
  public checkFeasibility(
    capabilities: CapabilityNode[],
    initialState: DependencyResolverState
  ): { isFeasible: boolean; finalState: DependencyResolverState | null } {
    let currentState: DependencyResolverState = {
      currentTime: initialState.currentTime,
      availableResources: { ...initialState.availableResources },
    };

    for (const node of capabilities) {
      // 1. Check Temporal Window Constraint
      if (node.timeWindow.start > node.timeWindow.end) {
        return { isFeasible: false, finalState: null };
      }

      // 2. Check Resource Availability at the required time
      // We assume the capability must start at or after the current time,
      // and must finish before the end of its window.
      const earliestStartTime = Math.max(currentState.currentTime, node.timeWindow.start);
      const latestEndTime = Math.min(currentState.currentTime + node.duration, node.timeWindow.end);

      if (earliestStartTime + node.duration > node.timeWindow.end) {
        return { isFeasible: false, finalState: null };
      }

      // 3. Check Resource Capacity
      if (!this.checkResourceAvailability(currentState, node)) {
        return { isFeasible: false, finalState: null };
      }

      // 4. Transition State
      currentState = this.calculateNextState(currentState, node);
    }

    return { isFeasible: true, finalState: currentState };
  }
}

export { TemporalCapabilityDependencyResolver };