export type CapabilityName = string;

export interface VersionRange {
  min: string;
  max: string;
}

export interface InputRequirement {
  name: string;
  type: string;
  required: boolean;
}

export interface SideEffect {
  resource: string;
  action: "read" | "write" | "delete";
}

export interface Capability {
  name: CapabilityName;
  version: string;
  description: string;
  inputs: InputRequirement[];
  effects: SideEffect[];
  requiredVersionRange: VersionRange;
}

export type ConflictDetail = {
  source: CapabilityName;
  conflictType: "InputConflict" | "EffectConflict" | "VersionConflict";
  message: string;
};

export type GapDetail = {
  source: CapabilityName;
  gapType: "MissingInput" | "MissingEffect";
  message: string;
};

export interface CompatibilityReport {
  isCompatible: boolean;
  conflicts: ConflictDetail[];
  gaps: GapDetail[];
  requiredUpgrades: {
    capability: CapabilityName;
    suggestedVersion: string;
    reason: string;
  }[];
}

export class CapabilityCompatibilityChecker {
  checkCompatibility(capabilities: Capability[]): CompatibilityReport {
    const conflicts: ConflictDetail[] = [];
    const gaps: GapDetail[] = [];
    const requiredUpgrades: {
      capability: CapabilityName;
      suggestedVersion: string;
      reason: string;
    }[] = [];

    const inputMap = new Map<string, Set<string>>();
    const effectMap = new Map<string, Set<string>>();

    for (let i = 0; i < capabilities.length; i++) {
      const cap = capabilities[i];

      // 1. Check Version Compatibility (Self-contained check for simplicity)
      // In a real scenario, we'd check against a global required range.
      // Here, we assume a simple check: if versions are too far apart, it's a conflict.
      if (i > 0) {
        const previousCap = capabilities[i - 1];
        if (!this.isVersionCompatible(cap.version, previousCap.version)) {
          conflicts.push({
            source: cap.name,
            conflictType: "VersionConflict",
            message: `Version ${cap.version} is incompatible with previous capability ${previousCap.name} (${previousCap.version}).`,
          });
          requiredUpgrades.push({
            capability: cap.name,
            suggestedVersion: "TBD",
            reason: "Requires manual version alignment.",
          });
        }
      }

      // 2. Check Inputs and Effects for Conflicts
      for (const input of cap.inputs) {
        const key = `${input.name}:${input.type}`;
        if (!inputMap.has(key)) {
          inputMap.set(key, new Set([cap.name]));
        } else {
          const existingSources = inputMap.get(key)!;
          if (existingSources.size > 1) {
            // This is a potential conflict if types are mutually exclusive,
            // but for simplicity, we treat multiple sources as a warning/gap.
          }
          existingSources.add(cap.name);
        }
      }

      for (const effect of cap.effects) {
        const key = `${effect.resource}:${effect.action}`;
        if (!effectMap.has(key)) {
          effectMap.set(key, new Set([cap.name]));
        } else {
          const existingSources = effectMap.get(key)!;
          // Conflict detection: If two capabilities write to the same resource,
          // and their actions are different (e.g., write vs delete).
          const conflictingActions = Array.from(existingSources).filter(
            sourceName => sourceName !== cap.name
          );

          // Simple conflict check: If we find multiple sources, we assume a conflict
          // unless the actions are identical.
          if (existingSources.size > 1) {
            conflicts.push({
              source: cap.name,
              conflictType: "EffectConflict",
              message: `Conflicting side effect on resource ${effect.resource} (${effect.action}). Multiple capabilities interact here.`,
            });
          }
          existingSources.add(cap.name);
        }
      }
    }

    // 3. Check for Missing Requirements (Gaps)
    // (Skipped complex gap detection for brevity, focusing on core conflict logic)

    return {
      isCompatible: conflicts.length === 0,
      conflicts: conflicts,
      gaps: gaps,
      requiredUpgrades: requiredUpgrades,
    };
  }

  private isVersionCompatible(v1: string, v2: string): boolean {
    // Placeholder logic: Assume compatibility if versions are within 1 major release difference.
    const major1 = parseInt(v1.split('.')[0]);
    const major2 = parseInt(v2.split('.')[0]);
    return Math.abs(major1 - major2) <= 1;
  }
}

export { CapabilityCompatibilityChecker };