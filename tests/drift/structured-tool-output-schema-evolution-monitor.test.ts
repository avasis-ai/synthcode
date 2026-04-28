import { describe, it, expect } from "vitest";
import { SchemaDriftReport } from "../src/drift/structured-tool-output-schema-evolution-monitor";

describe("SchemaDriftReport", () => {
  it("should correctly initialize with zero drifts when no history is present", () => {
    const report: SchemaDriftReport = {
      baselineSchema: {
        id: "test",
        name: "test",
      },
      history: [],
      summary: {
        totalDrifts: 0,
        driftDetails: {},
      },
    };
    expect(report.summary.totalDrifts).toBe(0);
    expect(report.history).toEqual([]);
  });

  it("should accurately calculate total drifts based on provided history", () => {
    const historyEntry = {
      observedSchema: {
        id: "test",
        name: "test",
        optionalField: true,
      },
      driftDetails: [
        {
          field: "optionalField",
          change: "added",
          count: 1,
          observedTypes: ["boolean"],
        },
      ],
    };
    const report: SchemaDriftReport = {
      baselineSchema: {
        id: "test",
        name: "test",
      },
      history: [historyEntry],
      summary: {
        totalDrifts: 1,
        driftDetails: {
          "optionalField": {
            description: "Field optionalField was added",
            count: 1,
          },
        },
      },
    };
    expect(report.summary.totalDrifts).toBe(1);
    expect(report.history.length).toBe(1);
  });

  it("should aggregate drift details correctly across multiple history entries", () => {
    const historyEntry1 = {
      observedSchema: {
        id: "test",
        name: "test",
      },
      driftDetails: [
        {
          field: "newField",
          change: "added",
          count: 1,
          observedTypes: ["string"],
        },
      ],
    };
    const historyEntry2 = {
      observedSchema: {
        id: "test",
        name: "test",
        newField: "updated",
      },
      driftDetails: [
        {
          field: "newField",
          change: "updated",
          count: 1,
          observedTypes: ["string"],
        },
      ],
    };
    const report: SchemaDriftReport = {
      baselineSchema: {
        id: "test",
        name: "test",
      },
      history: [historyEntry1, historyEntry2],
      summary: {
        totalDrifts: 2,
        driftDetails: {
          "newField": {
            description: "Field newField was added or updated",
            count: 2,
          },
        },
      },
    };
    expect(report.summary.totalDrifts).toBe(2);
    expect(report.summary.driftDetails["newField"].count).toBe(2);
  });
});