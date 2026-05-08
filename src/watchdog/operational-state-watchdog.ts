export type OperationalState = "NOMINAL" | "DEGRADED" | "CRITICAL";

export interface Metrics {
  latencyMs: number;
  resourceUtilization: number; // 0.0 to 1.0
  costPerCall: number;
  externalServiceAvailable: boolean;
}

export interface MitigationAction {
  name: string;
  description: string;
  execute: (currentState: OperationalState) => Promise<void>;
}

export class OperationalStateWatchdog {
  private readonly policies: Record<OperationalState, MitigationAction[]> = {
    NOMINAL: [],
    DEGRADED: [
      {
        name: "ReduceComplexity",
        description: "Reduce tool complexity and context window usage.",
        execute: async () => {
          console.log("Watchdog Action: Executing Complexity Reduction Plan.");
          await new Promise(resolve => setTimeout(resolve, 50));
        },
      },
      {
        name: "IncreasePruning",
        description: "Increase context pruning aggressiveness.",
        execute: async () => {
          console.log("Watchdog Action: Increasing Context Pruning.");
          await new Promise(resolve => setTimeout(resolve, 50));
        },
      },
    ],
    CRITICAL: [
      {
        name: "FallbackModelSwitch",
        description: "Switch to a lower-resource, fallback model.",
        execute: async () => {
          console.log("Watchdog Action: Switching to Fallback Model.");
          await new Promise(resolve => setTimeout(resolve, 100));
        },
      },
      {
        name: "HaltExecution",
        description: "Halt non-essential execution to conserve resources.",
        execute: async () => {
          console.error("Watchdog Action: CRITICAL FAILURE. Halting execution.");
          await new Promise(resolve => setTimeout(resolve, 100));
        },
      },
    ],
  };

  constructor(private readonly thresholds: {
    latencyMs: { degraded: number; critical: number };
    resourceUtilization: { degraded: number; critical: number };
    costPerCall: { degraded: number; critical: number };
  }) {}

  private calculateState(metrics: Metrics): OperationalState {
    let state: OperationalState = "NOMINAL";

    // Check for CRITICAL conditions
    if (metrics.latencyMs > this.thresholds.latencyMs.critical ||
      metrics.resourceUtilization > this.thresholds.resourceUtilization.critical ||
      metrics.costPerCall > this.thresholds.costPerCall.critical ||
      !metrics.externalServiceAvailable) {
      state = "CRITICAL";
    }
    // Check for DEGRADED conditions (only if not already CRITICAL)
    else if (metrics.latencyMs > this.thresholds.latencyMs.degraded ||
      metrics.resourceUtilization > this.thresholds.resourceUtilization.degraded ||
      metrics.costPerCall > this.thresholds.costPerCall.degraded) {
      state = "DEGRADED";
    }
    // Otherwise, NOMINAL

    return state;
  }

  public async processMetrics(metrics: Metrics): Promise<{ newState: OperationalState; plan: Promise<void> }> {
    const oldState: OperationalState = "NOMINAL"; // Simplified: In a real system, this would track the previous state.
    const newState = this.calculateState(metrics);

    let planPromise: Promise<void> = Promise.resolve();

    if (newState !== oldState) {
      console.log(`[Watchdog] State Change Detected: ${oldState} -> ${newState}`);
      const actions = this.policies[newState];
      
      if (actions && actions.length > 0) {
        const actionPromises = actions.map(action => action.execute(newState));
        planPromise = Promise.all(actionPromises);
      }
    } else {
      console.log(`[Watchdog] State remains ${newState}. No plan executed.`);
    }

    return { newState, plan: planPromise };
  }
}

export { OperationalStateWatchdog };