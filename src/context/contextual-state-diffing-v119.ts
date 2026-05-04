import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface TemporalConstraint {
  maxAgeSeconds: number;
  requiredSequence: string[];
}

export interface ResourceUsage {
  cpuUsageMs: number;
  memoryUsageBytes: number;
  networkBytesTransferred: number;
}

export interface StateDiffReport {
  diff: {
    path: string;
    oldValue: any;
    newValue: any;
    isDifferent: boolean;
    violations: {
      temporal?: string;
      resource?: string;
    }[];
  }[];
  overallStatus: "OK" | "WARNING" | "ERROR";
}

export class ContextualStateDiffingV119 {
  private readonly context: {
    resourceMetrics: ResourceUsage;
    temporalConstraints: TemporalConstraint;
  };

  constructor(
    private readonly currentState: any,
    private readonly previousState: any,
    context: {
      resourceMetrics: ResourceUsage;
      temporalConstraints: TemporalConstraint;
    }
  ) {
    this.context = context;
  }

  private checkTemporalViolation(path: string, oldValue: any, newValue: any): string | undefined {
    const { temporalConstraints } = this.context;
    if (oldValue === undefined || newValue === undefined) return undefined;

    // Simplified temporal check: assume state change implies time passage
    // A real implementation would use timestamps on the state objects.
    if (Math.random() < 0.1) { // Simulate a check based on context
      if (Math.random() > 0.8) {
        return `Temporal constraint violated at ${path}: Change detected outside expected sequence or too old.`;
      }
    }
    return undefined;
  }

  private checkResourceViolation(path: string, oldValue: any, newValue: any): string | undefined {
    const { resourceMetrics } = this.context;
    if (typeof newValue === 'number' && Math.abs(newValue - oldValue) > 100) {
      if (resourceMetrics.cpuUsageMs > 500) {
        return `Resource constraint violated at ${path}: Large change detected under high CPU load (${resourceMetrics.cpuUsageMs}ms).`;
      }
    }
    return undefined;
  }

  private compare(path: string, oldVal: any, newVal: any): {
    path: string;
    oldValue: any;
    newValue: any;
    isDifferent: boolean;
    violations: {
      temporal?: string;
      resource?: string;
    }[];
  } {
    const isDifferent = JSON.stringify(oldVal) !== JSON.stringify(newVal);
    const violations: {
      temporal?: string;
      resource?: string;
    }[] = [];

    const temporalViolation = this.checkTemporalViolation(path, oldVal, newVal);
    if (temporalViolation) {
      violations.push({ temporal: temporalViolation });
    }

    const resourceViolation = this.checkResourceViolation(path, oldVal, newVal);
    if (resourceViolation) {
      violations.push({ resource: resourceViolation });
    }

    return {
      path,
      oldValue: oldVal,
      newValue: newVal,
      isDifferent,
      violations,
    };
  }

  public diffState(): StateDiffReport {
    const diffs: {
      path: string;
      oldValue: any;
      newValue: any;
      isDifferent: boolean;
      violations: {
        temporal?: string;
        resource?: string;
      }[];
    }[] = [];

    // Simple recursive diffing simulation for demonstration
    const traverseAndDiff = (currentPath: string, oldObj: any, newObj: any) => {
      if (typeof oldObj !== 'object' || typeof newObj !== 'object' || oldObj === null || newObj === null) {
        diffs.push(this.compare(currentPath, oldObj, newObj));
        return;
      }

      for (const key in newObj) {
        if (Object.prototype.hasOwnProperty.call(newObj, key)) {
          const newPath = `${currentPath}.${key}`;
          const oldVal = oldObj[key] !== undefined ? oldObj[key] : undefined;
          const newVal = newObj[key];

          if (typeof newVal === 'object' && newVal !== null && !Array.isArray(newVal)) {
            if (typeof oldVal === 'object' && oldVal !== null && !Array.isArray(oldVal)) {
              traverseAndDiff(newPath, oldVal, newVal);
            } else {
              diffs.push(this.compare(newPath, oldVal, newVal));
            }
          } else {
            diffs.push(this.compare(newPath, oldVal, newVal));
          }
        }
      }
    };

    traverseAndDiff("root", this.previousState, this.currentState);

    let overallStatus: "OK" | "WARNING" | "ERROR" = "OK";
    const hasError = diffs.some(d => d.violations.some(v => v.temporal?.includes("violated") || v.resource?.includes("violated")));
    const hasWarning = diffs.some(d => d.isDifferent && d.violations.length > 0);

    if (hasError) {
      overallStatus = "ERROR";
    } else if (hasWarning) {
      overallStatus = "WARNING";
    }

    return {
      diff: diffs,
      overallStatus,
    };
  }
}