export type CapabilityName = string;
export type ResourceName = string;
export type AccessMode = "read" | "write" | "execute";
export type ConflictSeverity = "low" | "medium" | "high";

export interface CapabilityRequest {
  capability: CapabilityName;
  resource: ResourceName;
  mode: AccessMode;
  description: string;
}

export interface ConflictCondition {
  requiredCapabilities: CapabilityName[];
  // Logic to determine if the conflict applies based on the set of requested capabilities
  check(requestedCapabilities: CapabilityRequest[]): boolean;
}

export interface ConflictRule {
  name: string;
  severity: ConflictSeverity;
  condition: ConflictCondition;
  mitigation: string;
}

export interface ConflictDetail {
  ruleName: string;
  severity: ConflictSeverity;
  conflictingCapabilities: {
    capability: CapabilityName;
    resource: ResourceName;
    mode: AccessMode;
  }[];
  description: string;
  suggestedMitigation: string;
}

export interface ConflictReport {
  hasConflict: boolean;
  details: ConflictDetail[];
}

export class CapabilityConflictPredictor {
  private rules: ConflictRule[];

  constructor(rules: ConflictRule[] = []) {
    this.rules = rules;
  }

  /**
   * Predicts potential conflicts based on a list of proposed capability requests.
   * @param proposedRequests The sequence of capabilities requested.
   * @returns A ConflictReport detailing any predicted conflicts.
   */
  public predictConflicts(proposedRequests: CapabilityRequest[]): ConflictReport {
    const conflicts: ConflictDetail[] = [];

    for (const rule of this.rules) {
      if (rule.condition.check(proposedRequests)) {
        const conflictingCaps: {
          capability: CapabilityName;
          resource: ResourceName;
          mode: AccessMode;
        }[] = [];
        
        // Identify which specific capabilities triggered the conflict
        for (const request of proposedRequests) {
            conflictingCaps.push({
                capability: request.capability,
                resource: request.resource,
                mode: request.mode
            });
        }

        conflicts.push({
          ruleName: rule.name,
          severity: rule.severity,
          conflictingCapabilities: conflictingCaps,
          description: `Conflict detected by rule: ${rule.name}.`,
          suggestedMitigation: rule.mitigation,
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      details: conflicts,
    };
  }
}

export const createConflictPredictor = (rules: ConflictRule[]): CapabilityConflictPredictor => {
  return new CapabilityConflictPredictor(rules);
};