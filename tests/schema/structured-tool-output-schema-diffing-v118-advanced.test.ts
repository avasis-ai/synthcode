import { describe, it, expect } from "vitest";
import { SemanticImpactAnalyzer } from "../src/schema/structured-tool-output-schema-diffing-v118-advanced";

describe("SemanticImpactAnalyzer", () => {
  it("should calculate a low risk score when schemas are identical", () => {
    const schemaA: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };
    const schemaB: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };
    const analyzer = new SemanticImpactAnalyzer(schemaA, schemaB, []);
    const result = analyzer.analyze();

    expect(result.riskScore).toBeLessThan(1);
    expect(result.mitigationSteps).toHaveLength(0);
  });

  it("should calculate a high risk score when a required field is removed", () => {
    const schemaA: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        optionalField: { type: "string" },
      },
      required: ["id", "name"],
    };
    const schemaB: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };
    const analyzer = new SemanticImpactAnalyzer(schemaA, schemaB, []);
    const result = analyzer.analyze();

    expect(result.riskScore).toBeGreaterThan(0.5);
    expect(result.mitigationSteps).toContain("Consider re-adding the 'optionalField' or adjusting its necessity.");
  });

  it("should detect a type change for an existing field", () => {
    const schemaA: any = {
      type: "object",
      properties: {
        itemId: { type: "string" },
        count: { type: "number" },
      },
      required: ["itemId", "count"],
    };
    const schemaB: any = {
      type: "object",
      properties: {
        itemId: { type: "string" },
        count: { type: "string" },
      },
      required: ["itemId", "count"],
    };
    const analyzer = new SemanticImpactAnalyzer(schemaA, schemaB, []);
    const result = analyzer.analyze();

    expect(result.riskScore).toBeGreaterThan(0.5);
    expect(result.mitigationSteps).toContain("Type mismatch detected for 'count': changed from number to string.");
  });
});