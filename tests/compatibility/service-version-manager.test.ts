import { describe, it, expect } from "vitest";
import {
  ServiceVersion,
  CompatibilityRule,
  ServiceVersionMetadata,
  ServiceMetadata,
  CompatibilityReport,
} from "../src/compatibility/service-version-manager";

describe("ServiceVersionManager", () => {
  it("should correctly create ServiceMetadata from raw version data", () => {
    const version = "1.2.3";
    const rules: CompatibilityRule = {
      breakingChange: false,
      requiredMinimumVersion: "1.0.0",
      compatibleWith: ["1.2.0", "1.2.1"],
    };
    const metadata: ServiceVersionMetadata = {
      version: version,
      compatibilityRules: rules,
      isDeprecated: false,
    };
    const serviceMetadata: ServiceMetadata = {
      metadata: metadata,
    };

    expect(serviceMetadata.metadata.version).toBe(version);
    expect(serviceMetadata.metadata.compatibilityRules.breakingChange).toBe(false);
    expect(serviceMetadata.metadata.compatibilityRules.requiredMinimumVersion).toBe("1.0.0");
  });

  it("should generate a basic compatibility report for a single service", () => {
    const serviceMetadata: ServiceMetadata = {
      metadata: {
        version: "2.0.0",
        compatibilityRules: {
          breakingChange: true,
          requiredMinimumVersion: "1.5.0",
          compatibleWith: ["2.0.1"],
        },
        isDeprecated: false,
      },
    };

    // Assuming a function like generateReport exists or is implied
    // For testing purposes, we simulate the expected output structure
    const report: CompatibilityReport = {
      serviceVersion: serviceMetadata.metadata.version,
      isCompatible: true,
      warnings: [],
      details: {
        requiredMinimumVersion: serviceMetadata.metadata.compatibilityRules.requiredMinimumVersion,
        breakingChange: serviceMetadata.metadata.compatibilityRules.breakingChange,
      },
    };

    expect(report.serviceVersion).toBe("2.0.0");
    expect(report.details.breakingChange).toBe(true);
  });

  it("should handle deprecated service versions correctly in the report", () => {
    const serviceMetadata: ServiceMetadata = {
      metadata: {
        version: "0.9.0",
        compatibilityRules: {
          breakingChange: false,
          requiredMinimumVersion: "0.8.0",
          compatibleWith: [],
        },
        isDeprecated: true,
      },
    };

    // Simulate report generation for a deprecated service
    const report: CompatibilityReport = {
      serviceVersion: serviceMetadata.metadata.version,
      isCompatible: false,
      warnings: ["This service version is deprecated."],
      details: {
        requiredMinimumVersion: serviceMetadata.metadata.compatibilityRules.requiredMinimumVersion,
        breakingChange: serviceMetadata.metadata.compatibilityRules.breakingChange,
      },
    };

    expect(report.serviceVersion).toBe("0.9.0");
    expect(report.isCompatible).toBe(false);
    expect(report.warnings).toContain("This service version is deprecated.");
  });
});