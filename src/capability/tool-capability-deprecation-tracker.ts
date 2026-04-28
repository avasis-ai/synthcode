import { Capability } from "./capability";

export interface DeprecationEntry {
  deprecatedCapability: string;
  reason: string;
  recommendedReplacement: string;
  deprecationDate: Date;
}

export interface DeprecationReport {
  isDeprecating: boolean;
  warnings: {
    capability: string;
    message: string;
    replacement: string;
  }[];
}

export class ToolCapabilityDeprecationTracker {
  private deprecationEntries: DeprecationEntry[];
  private capabilityRegistry: Map<string, any>;

  constructor(
    capabilityRegistry: Map<string, any>,
    deprecationEntries: DeprecationEntry[]
  ) {
    this.capabilityRegistry = capabilityRegistry;
    this.deprecationEntries = deprecationEntries;
  }

  private isDeprecated(capabilityName: string): DeprecationEntry | undefined {
    for (const entry of this.deprecationEntries) {
      if (entry.deprecatedCapability === capabilityName) {
        return entry;
      }
    }
    return undefined;
  }

  public checkCapabilities(capabilities: Capability[]): DeprecationReport {
    const warnings: {
      capability: string;
      message: string;
      replacement: string;
    }[] = [];

    for (const capability of capabilities) {
      const entry = this.isDeprecated(capability.name);
      if (entry) {
        warnings.push({
          capability: capability.name,
          message: `Capability "${capability.name}" is deprecated. Reason: ${entry.reason}. Use "${entry.recommendedReplacement}" instead. Deprecation effective date: ${entry.deprecationDate.toISOString().split('T')[0]}`,
          replacement: entry.recommendedReplacement,
        });
      }
    }

    const report: DeprecationReport = {
      isDeprecating: warnings.length > 0,
      warnings: warnings,
    };

    return report;
  }
}