export type ConstraintId = string;
export type ConstraintType = "resource_limit" | "temporal_window" | "capability_mismatch";

export interface ViolationDetails {
  violationType: string;
  message: string;
  failedComponent: string;
}

export interface ViolationContext {
  timestamp: number;
  stateSnapshot: Record<string, unknown>;
  relatedInputs: Record<string, unknown>;
}

export interface ConstraintViolationReport {
  violationDetails: ViolationDetails;
  context: ViolationContext;
  severityScore: number;
}

export type UpdateType = "INCREASE_LIMIT" | "DECREASE_LIMIT" | "ADD_RULE" | "REMOVE_CONSTRAINT";

export interface ConstraintUpdatePayload {
  constraintId: ConstraintId;
  updateType: UpdateType;
  newValue: unknown;
  justification: string;
}

export interface AdaptationRule {
  triggerViolationType: string;
  minSeverity: number;
  // Function that takes the report and context and determines the payload
  generatePayload: (report: ConstraintViolationReport, context: ViolationContext) => ConstraintUpdatePayload | null;
}

export interface ConstraintManager {
  /**
   * Applies a structural update to the global constraint set.
   * @param payload The proposed change.
   * @returns boolean indicating success.
   */
  applyUpdate(payload: ConstraintUpdatePayload): boolean;
}

export class ConstraintAdaptationEngine {
  private readonly rules: AdaptationRule[];
  private readonly constraintManager: ConstraintManager;

  constructor(rules: AdaptationRule[], constraintManager: ConstraintManager) {
    this.rules = rules;
    this.constraintManager = constraintManager;
  }

  /**
   * Analyzes a violation report against defined rules and proposes structural updates.
   * @param report The detailed report of the violation.
   * @returns An array of proposed ConstraintUpdatePayloads.
   */
  analyzeAndGeneratePayloads(report: ConstraintViolationReport): ConstraintUpdatePayload[] {
    const payloads: ConstraintUpdatePayload[] = [];

    for (const rule of this.rules) {
      if (rule.triggerViolationType === report.violationDetails.violationType && rule.minSeverity <= report.severityScore) {
        const payload = rule.generatePayload(report, report.context);
        if (payload) {
          payloads.push(payload);
        }
      }
    }
    return payloads;
  }

  /**
   * Processes the violation report: generates payloads and applies them to the system.
   * @param report The detailed report of the violation.
   * @returns An object summarizing the adaptation process.
   */
  async adaptToViolation(report: ConstraintViolationReport): Promise<{ success: boolean; appliedUpdates: string[] }> {
    const payloads = this.analyzeAndGeneratePayloads(report);
    const appliedUpdates: string[] = [];
    let overallSuccess = true;

    for (const payload of payloads) {
      const success = this.constraintManager.applyUpdate(payload);
      if (success) {
        appliedUpdates.push(`Successfully applied update for ${payload.constraintId}: ${payload.updateType}`);
      } else {
        overallSuccess = false;
        appliedUpdates.push(`Failed to apply update for ${payload.constraintId}.`);
      }
    }

    return { success: overallSuccess, appliedUpdates };
  }
}