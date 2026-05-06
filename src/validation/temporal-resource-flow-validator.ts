import { EventEmitter } from "node:events";

type ResourceRequirements = {
  quota: number;
  memoryMB: number;
  computeTimeSeconds: number;
};

type TimeWindow = {
  minWaitSeconds: number;
  maxDeadlineSeconds: number;
};

interface FlowStep {
  name: string;
  requirements: ResourceRequirements;
  timeWindow: TimeWindow;
  requiredCapabilities: string[];
}

interface ResourceContext {
  currentTimeSeconds: number;
  availableResources: ResourceRequirements;
  history: {
    stepName: string;
    resourcesConsumed: ResourceRequirements;
    timeElapsed: number;
  }[];
}

interface ValidationFailure {
  stepName: string;
  reason: string;
  severity: "ERROR" | "WARNING";
}

export interface FlowValidationReport {
  isValid: boolean;
  failures: ValidationFailure[];
  finalContext: ResourceContext;
}

class TemporalResourceFlowValidator {
  private context: ResourceContext;

  constructor(initialContext: ResourceContext) {
    this.context = initialContext;
  }

  /**
   * Validates a sequence of steps against resource and temporal constraints.
   * @param steps The sequence of intended actions.
   * @returns A detailed validation report.
   */
  public validateFlow(steps: FlowStep[]): FlowValidationReport {
    let currentContext = {
      currentTimeSeconds: this.context.currentTimeSeconds,
      availableResources: { ...this.context.availableResources },
      history: [...this.context.history],
    };

    const failures: ValidationFailure[] = [];

    for (const step of steps) {
      const stepFailures = this.validateStep(step, currentContext);
      failures.push(...stepFailures);

      if (stepFailures.some(f => f.severity === "ERROR")) {
        // If a critical error occurs, stop processing the flow
        break;
      }

      // Update context only if the step was deemed valid enough to proceed
      currentContext = this.simulateStepExecution(step, currentContext);
    }

    const isValid = !failures.some(f => f.severity === "ERROR");

    return {
      isValid,
      failures,
      finalContext: currentContext,
    };
  }

  private validateStep(step: FlowStep, context: ResourceContext): ValidationFailure[] {
    const failures: ValidationFailure[] = [];

    // 1. Resource Check
    const required = step.requirements;
    const available = context.availableResources;

    if (required.quota > available.quota) {
      failures.push({
        stepName: step.name,
        reason: `Quota insufficient. Required: ${required.quota}, Available: ${available.quota}.`,
        severity: "ERROR",
      });
    }
    if (required.memoryMB > available.memoryMB) {
      failures.push({
        stepName: step.name,
        reason: `Memory insufficient. Required: ${required.memoryMB}MB, Available: ${available.memoryMB}MB.`,
        severity: "ERROR",
      });
    }

    // 2. Capability Check
    for (const capability of step.requiredCapabilities) {
      // Assuming capability check is external, here we just check for existence
      if (!capability) {
        failures.push({
          stepName: step.name,
          reason: `Missing required capability: ${capability}.`,
          severity: "ERROR",
        });
      }
    }

    // 3. Temporal Check
    const currentTime = context.currentTimeSeconds;
    const maxDeadline = currentTime + step.timeWindow.maxDeadlineSeconds;

    if (maxDeadline < currentTime + step.timeWindow.minWaitSeconds) {
      failures.push({
        stepName: step.name,
        reason: `Temporal conflict. Minimum wait time (${step.timeWindow.minWaitSeconds}s) exceeds deadline window.`,
        severity: "ERROR",
      });
    }

    return failures;
  }

  private simulateStepExecution(step: FlowStep, context: ResourceContext): ResourceContext {
    const required = step.requirements;

    // Simulate resource consumption
    const newAvailableResources: ResourceRequirements = {
      quota: context.availableResources.quota - required.quota,
      memoryMB: context.availableResources.memoryMB - required.memoryMB,
      computeTimeSeconds: context.availableResources.computeTimeSeconds - required.computeTimeSeconds,
    };

    // Simulate time progression (using the minimum wait time as the elapsed time)
    const elapsed = Math.max(0, step.timeWindow.minWaitSeconds);

    const newHistory = [
      ...context.history,
      {
        stepName: step.name,
        resourcesConsumed: required,
        timeElapsed: elapsed,
      },
    ];

    return {
      currentTimeSeconds: context.currentTimeSeconds + elapsed,
      availableResources: newAvailableResources,
      history: newHistory,
    };
  }
}

export { TemporalResourceFlowValidator };