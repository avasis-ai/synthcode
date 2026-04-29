import { TextBlock } from "./types";

export interface CompatibilityConstraint {
  minVersion?: string;
  maxVersion?: string;
  requiredContext?: string;
}

export interface Capability {
  name: string;
  version: string;
  description: string;
  constraints: CompatibilityConstraint;
}

export interface Conflict {
  capabilityName: string;
  reason: string;
}

export interface ResolutionResult {
  compatible: boolean;
  missing: Capability[];
  conflicts: Conflict[];
}

export class ToolCapabilityCompatibilityResolver {
  constructor(private requiredCapabilities: Capability[]) {}

  private checkVersionCompatibility(required: Capability, available: Capability): boolean {
    const checkVersion = (min: string, max: string, version: string): boolean => {
      const compare = (v1: string, v2: string): number => {
        const parts = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts.length, parts2.length); i++) {
          const p1 = parts[i] || 0;
          const p2 = parts2[i] || 0;
          if (p1 !== p2) return p1 - p2;
          if (p1 !== 0 || p2 !== 0) continue;
        }
        return 0;
      };

      const meetsMin = !min || compare(version, min) >= 0;
      const meetsMax = !max || compare(version, max) <= 0;
      return meetsMin && meetsMax;
    };

    if (required.constraints.requiredContext && required.constraints.requiredContext !== "any" && required.constraints.requiredContext !== available.constraints.requiredContext) {
      return false;
    }

    if (required.constraints.minVersion && !checkVersion(required.constraints.minVersion, undefined, available.version)) {
      return false;
    }

    if (required.constraints.maxVersion && !checkVersion(undefined, required.constraints.maxVersion, available.version)) {
      return false;
    }

    return true;
  }

  private checkCapabilityCompatibility(required: Capability, available: Capability): { compatible: boolean; conflict: Conflict | null } {
    const isVersionCompatible = this.checkVersionCompatibility(required, available);
    const isContextCompatible = required.constraints.requiredContext === "any" || required.constraints.requiredContext === available.constraints.requiredContext;

    if (!isVersionCompatible || !isContextCompatible) {
      const reason = `Version mismatch or context requirement not met. Required: ${required.name} (v${required.version}) with constraints: ${JSON.stringify(required.constraints)}. Available: ${available.name} (v${available.version}) with context: ${available.constraints.requiredContext || 'none'}.`;
      return { compatible: false, conflict: { capabilityName: required.name, reason: reason } };
    }

    return { compatible: true, conflict: null };
  }

  resolve(available: Capability[]): ResolutionResult {
    const missing: Capability[] = [];
    const conflicts: Conflict[] = [];
    let allCompatible = true;

    for (const required of this.requiredCapabilities) {
      let foundMatch = false;
      let bestMatchConflict: Conflict | null = null;

      for (const availableCap of available) {
        const { compatible, conflict } = this.checkCapabilityCompatibility(required, availableCap);

        if (compatible) {
          foundMatch = true;
          break;
        } else {
          // Record the conflict for this specific required capability against all available ones if no match is found
          if (bestMatchConflict === null) {
            bestMatchConflict = conflict;
          }
        }
      }

      if (!foundMatch) {
        allCompatible = false;
        missing.push(required);
        if (bestMatchConflict) {
          conflicts.push(bestMatchConflict);
        }
      }
    }

    return {
      compatible: allCompatible,
      missing: missing,
      conflicts: conflicts,
    };
  }
}