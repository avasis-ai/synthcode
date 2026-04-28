import { describe, it, expect } from "vitest";
import {
  CompatibilityMatrix,
  Capability,
  ToolCapability,
  CompatibilityReport,
} from "../src/capability/compatibility-matrix";

describe("CompatibilityMatrix", () => {
  it("should correctly determine compatibility when all components are compatible", () => {
    const capability: Capability = {
      name: "auth",
      description: "Authentication service",
    };
    const toolCapability: ToolCapability = {
      toolName: "user_manager",
      capabilities: [capability],
      requiredContext: {
        type: "user_id",
      },
      outputSchema: {
        id: "string",
      },
    };
    const matrix = new CompatibilityMatrix(
      [capability],
      [toolCapability],
    );
    const report: CompatibilityReport = matrix.generateReport();
    expect(report.isCompatible).toBe(true);
  });

  it("should report incompatibility when a required context is missing", () => {
    const capability: Capability = {
      name: "billing",
      description: "Billing service",
    };
    const toolCapability: ToolCapability = {
      toolName: "invoice_generator",
      capabilities: [capability],
      requiredContext: {
        type: "invoice_id",
      },
      outputSchema: {
        invoiceId: "string",
      },
    };
    const matrix = new CompatibilityMatrix(
      [capability],
      [toolCapability],
    );
    // Mocking the internal check to simulate failure for this test case structure
    (matrix as any).checkContextAvailability = () => false;
    const report: CompatibilityReport = matrix.generateReport();
    expect(report.isCompatible).toBe(false);
    expect(report.incompatibleDetails).toContain("Missing required context for invoice_generator");
  });

  it("should handle empty inputs gracefully", () => {
    const matrix = new CompatibilityMatrix([], []);
    const report: CompatibilityReport = matrix.generateReport();
    expect(report.isCompatible).toBe(true);
    expect(report.incompatibleDetails).toEqual([]);
  });
});