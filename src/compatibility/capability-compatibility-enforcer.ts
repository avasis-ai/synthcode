import { CapabilityRegistry, ToolCall, CompatibilityContract, CompatibilityResult } from "./types";

export class CapabilityCompatibilityEnforcer {
  private registry: CapabilityRegistry;

  constructor(registry: CapabilityRegistry) {
    this.registry = registry;
  }

  private checkVersionCompatibility(requiredVersion: string, capabilityName: string): boolean {
    const capability = this.registry.getCapability(capabilityName);
    if (!capability) {
      return false;
    }

    const requiredSemVer = new URLSearchParams(requiredVersion.split(',')).get('min');
    if (!requiredSemVer) {
      return true;
    }

    const currentVersion = capability.version;
    
    // Simple semantic version comparison (assuming major.minor.patch format)
    const [reqMajor, reqMinor, reqPatch] = requiredSemVer.split('.').map(Number);
    const [curMajor, curMinor, curPatch] = currentVersion.split('.').map(Number);

    return (
      curMajor > reqMajor ||
      (curMajor === reqMajor && curMinor > reqMinor) ||
      (curMajor === reqMajor && curMinor === reqMinor && curPatch >= reqPatch)
    );
  }

  private checkContractAdherence(toolCall: ToolCall, requiredContract: CompatibilityContract): boolean {
    if (!requiredContract.requiredInputs) {
      return true;
    }

    for (const [inputName, expectedType] of Object.entries(requiredContract.requiredInputs)) {
      if (!(inputName in toolCall.input)) {
        return false;
      }
      // Basic type check simulation
      if (typeof toolCall.input[inputName] !== expectedType) {
        return false;
      }
    }
    return true;
  }

  private checkKnownCompatibilityRules(toolCall: ToolCall, requiredContract: CompatibilityContract): boolean {
    if (!requiredContract.compatibilityRules) {
      return true;
    }

    for (const rule of requiredContract.compatibilityRules) {
      if (rule.type === "version_conflict") {
        const currentVersion = this.registry.getCapability(rule.capabilityName)?.version;
        if (currentVersion && rule.conflictingVersions.includes(currentVersion)) {
          return false;
        }
      }
      if (rule.type === "dependency_missing") {
        if (!this.registry.hasCapability(rule.dependencyName)) {
          return false;
        }
      }
    }
    return true;
  }

  enforce(toolCall: ToolCall, requiredContract: CompatibilityContract): CompatibilityResult {
    const requiredCapabilities = requiredContract.requiredCapabilities;

    if (!requiredCapabilities || requiredCapabilities.length === 0) {
      return { success: true, message: "No specific capabilities required." };
    }

    for (const capabilityName of requiredCapabilities) {
      // 1. Version Check
      if (!this.checkVersionCompatibility(requiredContract.versionRanges[capabilityName], capabilityName)) {
        return { success: false, message: `Capability ${capabilityName} failed version check. Requires ${requiredContract.versionRanges[capabilityName]}.` };
      }
    }

    // 2. Contract Adherence Check
    if (!this.checkContractAdherence(toolCall, requiredContract)) {
      return { success: false, message: "Tool call input failed to adhere to the required capability contract." };
    }

    // 3. Known Compatibility Rules Check
    if (!this.checkKnownCompatibilityRules(toolCall, requiredContract)) {
      return { success: false, message: "Tool call failed known compatibility rules or detected version conflicts." };
    }

    return { success: true, message: "Tool call is fully compatible with current deployed capabilities." };
  }
}