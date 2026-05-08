export type Message = any;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent = any;

export type Severity = "INFO" | "WARNING" | "CRITICAL";

export interface ContractMetrics {
  maxLatencyMs: number;
  requiredFields: string[];
  acceptableErrorRate: number;
}

export interface ServiceContract {
  metrics: ContractMetrics;
  validate(payload: unknown, metrics: Record<string, number>): { isValid: boolean; message: string };
}

export interface DriftViolation {
  rule: string;
  severity: Severity;
  description: string;
}

export interface DriftReport {
  isDriftDetected: boolean;
  violations: DriftViolation[];
  summary: string;
}

export class ServiceContractDriftMonitor {
  private contract: ServiceContract;

  constructor(contract: ServiceContract) {
    this.contract = contract;
  }

  private checkSchemaDrift(payload: unknown): DriftViolation[] {
    const violations: DriftViolation[] = [];
    if (typeof payload !== 'object' || payload === null) {
      return [{
        rule: "Schema Integrity",
        severity: "CRITICAL",
        description: "Payload is not a valid object.",
      }];
    }

    const payloadObject = payload as Record<string, unknown>;
    const required = this.contract.metrics.requiredFields;

    for (const field of required) {
      if (!(field in payloadObject) || payloadObject[field] === undefined || payloadObject[field] === null) {
        violations.push({
          rule: "Required Field Presence",
          severity: "CRITICAL",
          description: `Missing required field: ${field}.`,
        });
      }
    }
    return violations;
  }

  private checkMetricDrift(metrics: Record<string, number>): DriftViolation[] {
    const violations: DriftViolation[] = [];
    const contractMetrics = this.contract.metrics;

    if (metrics.latencyMs !== undefined && metrics.latencyMs > contractMetrics.maxLatencyMs) {
      violations.push({
        rule: "Latency SLA Violation",
        severity: "WARNING",
        description: `Observed latency (${metrics.latencyMs.toFixed(2)}ms) exceeds SLA (${contractMetrics.maxLatencyMs}ms).`,
      });
    }

    if (metrics.errorRate !== undefined && metrics.errorRate > contractMetrics.acceptableErrorRate) {
      violations.push({
        rule: "Error Rate Violation",
        severity: "WARNING",
        description: `Observed error rate (${(metrics.errorRate * 100).toFixed(2)}%) exceeds acceptable limit (${(contractMetrics.acceptableErrorRate * 100).toFixed(2)}%).`,
      });
    }

    return violations;
  }

  public checkAndDetectDrift(payload: unknown, metrics: Record<string, number>): DriftReport {
    const violations: DriftViolation[] = [];

    // 1. Check Schema/Structure Drift
    violations.push(...this.checkSchemaDrift(payload));

    // 2. Check Metric/Operational Drift
    violations.push(...this.checkMetricDrift(metrics));

    // 3. Run Contract's internal validation logic (Business Logic Check)
    const contractValidation = this.contract.validate(payload, metrics);
    if (!contractValidation.isValid) {
      violations.push({
        rule: "Contract Business Logic Failure",
        severity: "CRITICAL",
        description: contractValidation.message,
      });
    }

    const isDriftDetected = violations.length > 0;
    const summary = isDriftDetected
      ? `Drift detected: ${violations.length} violation(s) found.`
      : "Service contract adherence confirmed. No drift detected.";

    return {
      isDriftDetected,
      violations,
      summary,
    };
  }
}

export { ServiceContractDriftMonitor };