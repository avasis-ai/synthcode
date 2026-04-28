import { describe, it, expect } from "vitest";
import { SchemaEvolutionTracker } from "../src/schema/structured-output-schema-evolution-tracker";

describe("SchemaEvolutionTracker", () => {
  it("should correctly generate an evolution report for a simple addition", () => {
    const tracker = new SchemaEvolutionTracker();
    tracker.recordChange(
      "Initial schema",
      {
        addedFields: ["name", "email"],
        removedFields: [],
        changedTypes: [],
      }
    );
    tracker.recordChange(
      "Added age field",
      {
        addedFields: ["age"],
        removedFields: [],
        changedTypes: [],
      }
    );

    const report = tracker.generateReport();

    expect(report.changes.length).toBe(2);
    expect(report.changes[1].addedFields).toContain("age");
    expect(report.compatibilityRisks).toContain("New fields like 'age' might require updates in downstream consumers.");
  });

  it("should correctly track field type changes", () => {
    const tracker = new SchemaEvolutionTracker();
    tracker.recordChange(
      "Initial schema",
      {
        addedFields: ["id", "status"],
        removedFields: [],
        changedTypes: [{ field: "id", oldType: "string", newType: "number" }],
      }
    );

    const report = tracker.generateReport();

    expect(report.changes.length).toBe(1);
    expect(report.changes[0].changedTypes.length).toBe(1);
    expect(report.changes[0].changedTypes[0].field).toBe("id");
    expect(report.changes[0].changedTypes[0].oldType).toBe("string");
    expect(report.changes[0].changedTypes[0].newType).toBe("number");
  });

  it("should handle multiple types of changes accurately", () => {
    const tracker = new SchemaEvolutionTracker();
    tracker.recordChange(
      "First version",
      {
        addedFields: ["title"],
        removedFields: ["old_field"],
        changedTypes: [{ field: "title", oldType: "string", newType: "string" }],
      }
    );
    tracker.recordChange(
      "Second version",
      {
        addedFields: ["author"],
        removedFields: ["title"],
        changedTypes: [{ field: "status", oldType: "boolean", newType: "string" }],
      }
    );

    const report = tracker.generateReport();

    expect(report.changes.length).toBe(2);
    expect(report.changes[0].removedFields).toContain("old_field");
    expect(report.changes[1].addedFields).toContain("author");
    expect(report.changes[1].changedTypes.length).toBe(1);
  });
});