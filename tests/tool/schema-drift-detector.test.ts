import { describe, it, expect } from "vitest";
import { SchemaDriftDetector } from "../src/tool/schema-drift-detector";

describe("SchemaDriftDetector", () => {
  it("should detect a simple type mismatch", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };
    const detector = new SchemaDriftDetector(schema);
    const report = detector.detectDrift({ id: "abc", name: "Test" });

    expect(report.deviations).toHaveLength(1);
    expect(report.deviations[0].path).toBe("id");
    expect(report.deviations[0].severity).toBe("Error");
  });

  it("should report no drift for matching data", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };
    const detector = new SchemaDriftDetector(schema);
    const report = detector.detectDrift({ id: 123, name: "Test" });

    expect(report.deviations).toHaveLength(0);
  });

  it("should handle missing required fields as errors", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "integer" },
        email: { type: "string" },
      },
      required: ["id", "email"],
    };
    const detector = new SchemaDriftDetector(schema);
    const report = detector.detectDrift({ id: 456 });

    expect(report.deviations).toHaveLength(1);
    expect(report.deviations[0].path).toBe("email");
    expect(report.deviations[0].severity).toBe("Error");
  });
});