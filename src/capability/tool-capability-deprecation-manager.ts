import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export enum DeprecationStatus {
  ACTIVE = "ACTIVE",
  DEPRECATED = "DEPRECATED",
  REMOVED = "REMOVED",
}

export interface CapabilityInfo {
  status: DeprecationStatus;
  deprecationMessage: string;
  migrationPath?: string;
}

export class ToolCapabilityDeprecationManager {
  private registry: Map<string, CapabilityInfo>;
  private enforceWarnings: boolean;

  constructor(initialCapabilities: Record<string, Omit<CapabilityInfo, 'status' | 'deprecationMessage' | 'migrationPath'>> = {}, enforceWarnings: boolean = false) {
    this.registry = new Map<string, CapabilityInfo>();
    this.enforceWarnings = enforceWarnings;

    for (const [name, info] of Object.entries(initialCapabilities)) {
      this.registry.set(
        name,
        {
          status: DeprecationStatus.ACTIVE,
          deprecationMessage: "",
          migrationPath: undefined,
          ...info,
        }
      );
    }
  }

  setCapabilityStatus(
    capabilityName: string,
    status: DeprecationStatus,
    message: string,
    migrationPath?: string
  ): void {
    this.registry.set(
      capabilityName,
      {
        status: status,
        deprecationMessage: message,
        migrationPath: migrationPath,
      }
    );
  }

  setEnforceWarnings(enforce: boolean): void {
    this.enforceWarnings = enforce;
  }

  getCapabilityInfo(capabilityName: string): CapabilityInfo | undefined {
    return this.registry.get(capabilityName);
  }

  checkCapabilityUsage(capabilityName: string, context: any): {
    isValid: boolean;
    warning: string | null;
  } {
    const info = this.registry.get(capabilityName);

    if (!info) {
      return { isValid: true, warning: null };
    }

    if (info.status === DeprecationStatus.ACTIVE) {
      return { isValid: true, warning: null };
    }

    let warning: string | null = null;

    if (info.status === DeprecationStatus.DEPRECATED) {
      warning = `Warning: Capability '${capabilityName}' is deprecated. ${info.deprecationMessage} Consider migrating to: ${info.migrationPath || 'a newer capability.'}`;
    } else if (info.status === DeprecationStatus.REMOVED) {
      warning = `Error: Capability '${capabilityName}' has been removed and cannot be used.`;
    }

    const isValid = info.status !== DeprecationStatus.REMOVED;

    if (!isValid && this.enforceWarnings) {
      // In a real system, this might throw an error or return a specific failure type
      console.warn(`[DeprecationManager] Enforced Error: ${warning}`);
    }

    return { isValid, warning };
  }
}