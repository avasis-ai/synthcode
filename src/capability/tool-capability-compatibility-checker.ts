import { CapabilityRegistry } from "./capability-registry";

export interface CapabilityRequirements {
  [key: string]: {
    requiredVersion?: string;
    minVersion?: string;
    featureFlags?: Record<string, boolean>;
  };
}

export interface CompatibilityResult {
  isCompatible: boolean;
  incompatibilities: string[];
}

export class ToolCapabilityCompatibilityChecker {
  private availableCapabilities: CapabilityRegistry;

  constructor(availableCapabilities: CapabilityRegistry) {
    this.availableCapabilities = availableCapabilities;
  }

  check(required: CapabilityRequirements): CompatibilityResult {
    const incompatibilities: string[] = [];
    let isCompatible = true;

    for (const toolCapabilityName in required) {
      if (!Object.prototype.hasOwnProperty.call(required, toolCapabilityName)) {
        continue;
      }

      const requiredSpec = required[toolCapabilityName];
      const availableCap = this.availableCapabilities.get(toolCapabilityName);

      if (!availableCap) {
        incompatibilities.push(`Missing required capability: ${toolCapabilityName}`);
        isCompatible = false;
        continue;
      }

      if (requiredSpec.requiredVersion) {
        if (availableCap.version !== requiredSpec.requiredVersion) {
          incompatibilities.push(
            `Capability ${toolCapabilityName}: Requires exact version ${requiredSpec.requiredVersion}, but found ${availableCap.version}.`
          );
          isCompatible = false;
        }
      }

      if (requiredSpec.minVersion) {
        if (!this.compareVersions(availableCap.version, requiredSpec.minVersion)) {
          incompatibilities.push(
            `Capability ${toolCapabilityName}: Requires minimum version ${requiredSpec.minVersion}, but found ${availableCap.version}.`
          );
          isCompatible = false;
        }
      }

      if (requiredSpec.featureFlags) {
        for (const flagName in requiredSpec.featureFlags) {
          if (!Object.prototype.hasOwnProperty.call(requiredSpec.featureFlags, flagName)) {
            continue;
          }
          const requiredFlagState = requiredSpec.featureFlags[flagName];
          if (requiredFlagState && !availableCap.features[flagName]) {
            incompatibilities.push(
              `Capability ${toolCapabilityName}: Missing required feature flag '${flagName}'.`
            );
            isCompatible = false;
          }
        }
      }
    }

    return {
      isCompatible,
      incompatibilities,
    };
  }

  private compareVersions(current: string, required: string): boolean {
    const partsA = current.split('.').map(Number);
    const partsB = required.split('.').map(Number);

    const maxLength = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLength; i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;

      if (numA < numB) {
        return false;
      }
      if (numA > numB) {
        return true;
      }
    }
    return true;
  }
}