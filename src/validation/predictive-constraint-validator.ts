import {
  PredictiveConstraintViolation,
  ResourceSchedule,
  TimeWindow,
  PlannedStep,
  ValidationContext,
} from "./types";

export class PredictiveConstraintValidator {
  private readonly resourceSchedules: Map<string, ResourceSchedule>;

  constructor(resourceSchedules: Map<string, ResourceSchedule>) {
    this.resourceSchedules = resourceSchedules;
  }

  validate(
    plannedSteps: PlannedStep[],
    context: ValidationContext,
    timeWindow: TimeWindow,
  ): { violations: PredictiveConstraintViolation[]; success: boolean } {
    const violations: PredictiveConstraintViolation[] = [];
    let currentTime = timeWindow.startTime;

    for (let i = 0; i < plannedSteps.length; i++) {
      const step = plannedSteps[i];
      const stepIndex = i;

      // 1. Calculate predicted timing
      const predictedStartTime = currentTime;
      const predictedEndTime = predictedStartTime + step.estimatedDuration;

      // 2. Check Time Window bounds
      if (predictedStartTime < timeWindow.startTime || predictedEndTime > timeWindow.endTime) {
        violations.push(this.createTimeViolation(step, predictedStartTime, predictedEndTime, timeWindow));
      }

      // 3. Check Resource Availability
      for (const requiredResource of step.requiredResources) {
        const resourceName = requiredResource.name;
        const requiredQuota = requiredResource.quota;

        if (!this.resourceSchedules.has(resourceName)) {
          violations.push(this.createResourceViolation(
            step,
            resourceName,
            predictedStartTime,
            predictedEndTime,
            `Resource schedule not found for ${resourceName}.`,
          ));
          continue;
        }

        const schedule = this.resourceSchedules.get(resourceName)!;
        const conflict = this.checkResourceConflict(
          schedule,
          requiredQuota,
          predictedStartTime,
          predictedEndTime,
          resourceName,
        );

        if (conflict) {
          violations.push(this.createResourceViolation(
            step,
            resourceName,
            predictedStartTime,
            predictedEndTime,
            conflict,
          ));
        }
      }

      // 4. Check Dependencies (Simplified: assumes dependency failure windows are provided)
      for (const dependency of step.dependencies) {
        const failureWindow = dependency.failureWindow;
        if (failureWindow &&
          (predictedStartTime < failureWindow.start || predictedEndTime > failureWindow.end)) {
          violations.push(
            this.createDependencyViolation(
              step,
              dependency.name,
              predictedStartTime,
              predictedEndTime,
              `Dependency ${dependency.name} is predicted to fail during the execution window.`,
            ),
          );
        }
      }

      // Update current time for the next step
      currentTime = predictedEndTime;
    }

    return {
      violations,
      success: violations.length === 0,
    };
  }

  private createTimeViolation(
    step: PlannedStep,
    start: number,
    end: number,
    window: TimeWindow,
  ): PredictiveConstraintViolation {
    return {
      stepName: step.name,
      violationType: "TimeWindowConstraint",
      message: `Predicted execution time (${start} to ${end}) exceeds the defined time window (${window.startTime} to ${window.endTime}).`,
      details: {
        predictedStart: start,
        predictedEnd: end,
        windowStart: window.startTime,
        windowEnd: window.endTime,
      },
    };
  }

  private createResourceViolation(
    step: PlannedStep,
    resourceName: string,
    start: number,
    end: number,
    message: string | PredictiveConstraintViolation,
  ): PredictiveConstraintViolation {
    const details = typeof message === "string" ? { message } : message.details;
    return {
      stepName: step.name,
      violationType: "ResourceConstraint",
      message: `Resource ${resourceName} constraint violated. ${typeof message === "string" ? message : ""}`,
      details: {
        resourceName,
        predictedStart: start,
        predictedEnd: end,
        ...details,
      },
    };
  }

  private createDependencyViolation(
    step: PlannedStep,
    dependencyName: string,
    start: number,
    end: number,
    message: string,
  ): PredictiveConstraintViolation {
    return {
      stepName: step.name,
      violationType: "DependencyConstraint",
      message: message,
      details: {
        dependencyName,
        predictedStart: start,
        predictedEnd: end,
      },
    };
  }

  private checkResourceConflict(
    schedule: ResourceSchedule,
    requiredQuota: number,
    start: number,
    end: number,
    resourceName: string,
  ): PredictiveConstraintViolation | null {
    const conflicts: PredictiveConstraintViolation[] = [];

    for (const conflictTime of schedule.conflicts) {
      const conflictStart = conflictTime.start;
      const conflictEnd = conflictTime.end;

      // Check for overlap: [A_start, A_end] overlaps [B_start, B_end]
      // Overlap exists if A_start < B_end AND A_end > B_start
      if (start < conflictEnd && end > conflictStart) {
        conflicts.push({
          stepName: "N/A",
          violationType: "ResourceConflict",
          message: `Resource ${resourceName} is unavailable or degraded during the planned step.`,
          details: {
            resourceName,
            predictedStart: start,
            predictedEnd: end,
            conflictStart: conflictStart,
            conflictEnd: conflictEnd,
            requiredQuota,
          },
        });
      }
    }

    if (conflicts.length > 0) {
      return conflicts[0];
    }
    return null;
  }
}