import { Step } from "../types/step";

export type TimeDelta = number;

export type DependencyType = "before" | "after" | "within";

export interface TemporalConstraint {
  sourceStepId: string;
  targetStepId: string;
  type: DependencyType;
  delta: TimeDelta;
}

export interface TimeWindow {
  est: number;
  lft: number;
}

export interface ResolvedStep {
  step: Step;
  startTime: number;
  endTime: number;
  timeWindow: TimeWindow;
}

export interface ResolvedSequence {
  steps: ResolvedStep[];
  totalDuration: number;
}

export class TemporalDependencyResolver {
  constructor() {}

  private calculateInitialTimeWindows(steps: Step[]): Map<string, TimeWindow> {
    const initialWindows = new Map<string, TimeWindow>();
    for (const step of steps) {
      initialWindows.set(step.id, { est: 0, lft: Infinity });
    }
    return initialWindows;
  }

  private updateTimeWindow(
    currentWindow: TimeWindow,
    newEST: number,
    newLFT: number
  ): TimeWindow {
    return {
      est: Math.max(currentWindow.est, newEST),
      lft: Math.min(currentWindow.lft, newLFT),
    };
  }

  public resolve(steps: Step[], constraints: TemporalConstraint[]): ResolvedSequence {
    const stepMap = new Map<string, Step>();
    for (const step of steps) {
      stepMap.set(step.id, step);
    }

    const initialWindows = this.calculateInitialTimeWindows(steps);
    const stepWindows = new Map<string, TimeWindow>(initialWindows);
    const resolvedSteps: ResolvedStep[] = [];

    // Simple topological sort simulation for dependency processing order
    // In a real system, this would require a robust graph solver.
    // Here, we process iteratively until stable or all steps are processed.
    let processedCount = 0;
    let changed = true;

    while (changed && processedCount < steps.length) {
      changed = false;
      for (const constraint of constraints) {
        const sourceWindow = stepWindows.get(constraint.sourceStepId);
        const targetWindow = stepWindows.get(constraint.targetStepId);

        if (!sourceWindow || !targetWindow) continue;

        let newEST: number;
        let newLFT: number;

        switch (constraint.type) {
          case "after":
            // Target must start after Source finishes
            newEST = sourceWindow.est + (sourceWindow.lft - sourceWindow.est);
            newLFT = Infinity;
            break;
          case "before":
            // Target must finish before Source starts
            newEST = 0;
            newLFT = sourceWindow.est - 1;
            break;
          case "within":
            // Target must start within delta of Source start
            newEST = sourceWindow.est;
            newLFT = sourceWindow.est + constraint.delta;
            break;
        }

        // Apply the constraint update to the target window
        const oldWindow = stepWindows.get(constraint.targetStepId)!;
        const updatedWindow = this.updateTimeWindow(
          oldWindow,
          newEST,
          newLFT
        );

        if (JSON.stringify(oldWindow) !== JSON.stringify(updatedWindow)) {
          stepWindows.set(constraint.targetStepId, updatedWindow);
          changed = true;
        }
      }
      processedCount++;
    }

    // Final assignment of times (assuming sequential execution based on EST)
    let currentTime = 0;
    const sortedSteps = steps.sort((a, b) => {
      const windowA = stepWindows.get(a.id)!;
      const windowB = stepWindows.get(b.id)!;
      return windowA.est - windowB.est;
    });

    for (const step of sortedSteps) {
      const window = stepWindows.get(step.id)!;

      // Determine start time: Max of current time and EST
      const startTime = Math.max(currentTime, window.est);
      
      // Assuming duration is fixed for simplicity, or derived from step metadata
      // Using a placeholder duration of 100ms if not available
      const duration = (step as any).duration || 100; 
      const endTime = startTime + duration;

      const resolvedStep: ResolvedStep = {
        step: step,
        startTime: startTime,
        endTime: endTime,
        timeWindow: window,
      };
      resolvedSteps.push(resolvedStep);
      currentTime = endTime;
    }

    const totalDuration = resolvedSteps.length > 0 ? resolvedSteps[resolvedSteps.length - 1].endTime : 0;

    return {
      steps: resolvedSteps,
      totalDuration: totalDuration,
    };
  }
}

export { TemporalDependencyResolver };