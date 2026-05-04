import { describe, it, expect } from "vitest";
import { SemanticDiffReport, SemanticIgnoreRules } from "../context/contextual-state-diffing-v111";
import { diffContextualState } from "../context/contextual-state-diffing-v111";

describe("diffContextualState", () => {
  it("should return an empty report when states are identical", () => {
    const state1 = {
      messages: [{ id: "m1", content: "Hello" }],
      metadata: { version: 1 },
    };
    const state2 = {
      messages: [{ id: "m1", content: "Hello" }],
      metadata: { version: 1 },
    };
    const rules: SemanticIgnoreRules = {
      ignoreFields: ["metadata.version"],
    };

    const report = diffContextualState(state1, state2, rules);

    expect(report.isSemanticallyDifferent).toBe(false);
    expect(Object.keys(report.changedEntities)).toHaveLength(0);
    expect(report.structuralChanges).toHaveLength(0);
  });

  it("should detect changes in content blocks and report them", () => {
    const state1 = {
      messages: [{ id: "m1", content: [{ type: "text", text: "Old text" }] }],
      metadata: { version: 1 },
    };
    const state2 = {
      messages: [{ id: "m1", content: [{ type: "text", text: "New text" }] }],
      metadata: { version: 1 },
    };
    const rules: SemanticIgnoreRules = {
      ignoreFields: [],
    };

    const report = diffContextualState(state1, state2, rules);

    expect(report.isSemanticallyDifferent).toBe(true);
    expect(report.changedEntities["messages.0.content"]).toBeDefined();
    expect(report.changedEntities["messages.0.content"]!.newValue).toEqual([{ type: "text", text: "New text" }]);
  });

  it("should ignore changes in fields specified in ignoreFields", () => {
    const state1 = {
      messages: [{ id: "m1", content: [{ type: "text", text: "Some text" }] }],
      metadata: { version: 1 },
    };
    const state2 = {
      messages: [{ id: "m1", content: [{ type: "text", text: "Some text" }] }],
      metadata: { version: 100 }, // Changed version
    };
    const rules: SemanticIgnoreRules = {
      ignoreFields: ["metadata.version"],
    };

    const report = diffContextualState(state1, state2, rules);

    expect(report.isSemanticallyDifferent).toBe(false);
    expect(report.changedEntities["metadata.version"]).toBeUndefined();
  });
});