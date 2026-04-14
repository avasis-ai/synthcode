export type SafetyClass = "read" | "write" | "destroy" | "network" | "execute";
export type Verdict = "pass" | "warn" | "block" | "escalate";

export interface FastPathResult {
  verdict: Verdict;
  checks: Array<{
    rule: string;
    passed: boolean;
    severity: "critical" | "warning" | "info";
    message: string;
  }>;
  latencyUs: number;
}

export interface SlowPathResult {
  verdict: Verdict;
  reasoning: string;
  invariantChecks: Array<{
    invariant: string;
    satisfied: boolean;
    detail: string;
  }>;
  latencyMs: number;
}

export interface DualPathVerdict {
  toolName: string;
  fastPath: FastPathResult;
  slowPath?: SlowPathResult;
  finalVerdict: Verdict;
  reason?: string;
  totalLatencyMs: number;
  pathTaken: "fast" | "fast+slow";
}

export interface ToolOperation {
  name: string;
  input: Record<string, unknown>;
  safetyClass: SafetyClass;
  targetsFiles: string[];
}

export interface RoutingPolicy {
  alwaysSlowPathFor: SafetyClass[];
  warnEscalatesToSlow: boolean;
  consecutiveFailuresTriggerSlow: number;
  maxConsecutiveFailures: number;
  firstNTurnsFastOnly: number;
  fileNotInGraphTriggersSlow: boolean;
  writeWithoutReadTriggersSlow: boolean;
}

export const DEFAULT_ROUTING_POLICY: RoutingPolicy = {
  alwaysSlowPathFor: ["destroy"],
  warnEscalatesToSlow: true,
  consecutiveFailuresTriggerSlow: 1,
  maxConsecutiveFailures: 3,
  firstNTurnsFastOnly: 3,
  fileNotInGraphTriggersSlow: true,
  writeWithoutReadTriggersSlow: true,
};
