type ResourceRequirements = Record<string, number>;

export interface ResourceState {
  capacity: ResourceRequirements;
  initialUsage: ResourceRequirements;
}

export interface SimulationStep {
  name: string;
  resourceRequirements: ResourceRequirements;
  durationSeconds: number;
}

export interface ConflictReport {
  conflicts: {
    stepIndex: number;
    stepName: string;
    resource: string;
    exceededCapacity: number;
    currentUsage: number;
  }[];
  isConflict: boolean;
}

export class PredictiveResourceConflictSimulator {
  private readonly initialState: ResourceState;

  constructor(initialState: ResourceState) {
    this.initialState = initialState;
  }

  simulate(steps: SimulationStep[]): ConflictReport {
    let currentUsage: ResourceRequirements = { ...this.initialState.initialUsage };
    const conflicts: ConflictReport['conflicts'] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      let nextUsage: ResourceRequirements = { ...currentUsage };

      // Calculate the usage increase for this step
      for (const resource in step.resourceRequirements) {
        const usageIncrease = step.resourceRequirements[resource];
        nextUsage[resource] = (nextUsage[resource] || 0) + usageIncrease;
      }

      // Check for conflicts after this step completes
      for (const resource in nextUsage) {
        const usage = nextUsage[resource];
        const capacity = this.initialState.capacity[resource] || Infinity;

        if (usage > capacity) {
          conflicts.push({
            stepIndex: i,
            stepName: step.name,
            resource: resource,
            exceededCapacity: usage,
            currentUsage: usage,
          });
        }
      }

      // Update the current usage for the next iteration
      currentUsage = nextUsage;
    }

    return {
      conflicts: conflicts,
      isConflict: conflicts.length > 0,
    };
  }
}