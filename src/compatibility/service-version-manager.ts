export type ServiceVersion = string;

export interface CompatibilityRule {
  breakingChange: boolean;
  requiredMinimumVersion: ServiceVersion;
  compatibleWith: ServiceVersion[];
}

export interface ServiceVersionMetadata {
  version: ServiceVersion;
  compatibilityRules: CompatibilityRule;
  isDeprecated: boolean;
}

export interface ServiceMetadata {
  metadata: ServiceVersionMetadata;
  // Placeholder for service implementation details if needed later
}

export interface CompatibilityReport {
  isCompatible: boolean;
  message: string;
  warnings: string[];
  errors: string[];
}

export class ServiceVersionCompatibilityManager {
  private services: Map<string, ServiceMetadata> = new Map();

  registerService(serviceName: string, metadata: ServiceMetadata): void {
    if (this.services.has(serviceName)) {
      console.warn(`Overwriting metadata for service: ${serviceName}`);
    }
    this.services.set(serviceName, metadata);
  }

  getServiceMetadata(serviceName: string): ServiceMetadata | undefined {
    return this.services.get(serviceName);
  }

  /**
   * Checks the compatibility between a required version (from plan/tool)
   * and a deployed version (from service metadata).
   * @param serviceName The name of the service being checked.
   * @param requiredVersion The version needed by the calling component.
   * @param deployedVersion The version currently deployed for the service.
   */
  checkCompatibility(
    serviceName: string,
    requiredVersion: ServiceVersion,
    deployedVersion: ServiceVersion
  ): CompatibilityReport {
    const serviceMeta = this.getServiceMetadata(serviceName);

    if (!serviceMeta) {
      return {
        isCompatible: false,
        message: `Service ${serviceName} is not registered.`,
        warnings: [],
        errors: ["Service not found"],
      };
    }

    const deployedMetadata = serviceMeta.metadata;
    const report: CompatibilityReport = {
      isCompatible: true,
      message: `Compatibility check passed for ${serviceName}.`,
      warnings: [],
      errors: [],
    };

    // 1. Check Deprecation
    if (deployedMetadata.isDeprecated) {
      report.isCompatible = false;
      report.errors.push(`Service ${serviceName} (v${deployedMetadata.version}) is deprecated.`);
    }

    // 2. Check Minimum Version Requirement
    // Simple string comparison for demonstration; real world needs semantic versioning library.
    if (this.compareVersions(requiredVersion, deployedMetadata.compatibilityRules.requiredMinimumVersion) < 0) {
      report.isCompatible = false;
      report.errors.push(
        `Required version (${requiredVersion}) is older than the minimum supported version (${deployedMetadata.compatibilityRules.requiredMinimumVersion}) for ${serviceName}.`,
      );
    }

    // 3. Check Breaking Changes
    if (deployedMetadata.compatibilityRules.breakingChange) {
      report.warnings.push(
        `Warning: Service ${serviceName} (v${deployedMetadata.version}) has breaking changes. Review usage carefully.`,
      );
    }

    // 4. Check Explicit Compatibility List
    if (!deployedMetadata.compatibilityRules.compatibleWith.includes(requiredVersion)) {
      report.isCompatible = false;
      report.errors.push(
        `The required version (${requiredVersion}) is not explicitly compatible with the deployed version (${deployedMetadata.version}) of ${serviceName}.`,
      );
    }

    // Final determination
    if (report.errors.length > 0) {
      report.message = `Compatibility check failed for ${serviceName}.`;
    } else if (report.warnings.length > 0) {
      report.message = `Compatibility check passed for ${serviceName}, but with warnings.`;
    }

    return report;
  }

  /**
   * Simple semantic version comparison (Major.Minor.Patch).
   * Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2.
   */
  private compareVersions(v1: ServiceVersion, v2: ServiceVersion): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const n1 = parts1[i] || 0;
      const n2 = parts2[i] || 0;

      if (n1 < n2) return -1;
      if (n1 > n2) return 1;
    }
    return 0;
  }
}

export { ServiceVersionCompatibilityManager }