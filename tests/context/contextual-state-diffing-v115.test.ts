import { describe, it, expect } from "vitest";
import { ContextualStateDiffingV115Service } from "../src/context/contextual-state-diffing-v115";

describe("ContextualStateDiffingV115Service", () => {
  it("should calculate diff correctly when critical fields change", () => {
    const options = { criticalFields: ["message", "toolUses"] };
    const service = new ContextualStateDiffingV115Service(options);

    const oldState = {
      message: "Hello",
      toolUses: [{ tool: "A", input: "1" }],
      otherData: "ignore",
    };
    const newState = {
      message: "Hello World",
      toolUses: [{ tool: "A", input: "1" }],
      otherData: "ignore",
    };

    // Mocking the internal diffing logic for simplicity in the test structure
    // Assuming the service has a method or internal logic that can be tested.
    // Since the full implementation is not visible, we test the constructor and basic usage pattern.
    // For a real test, we'd call the main diffing method.
    const diffResult = service["calculateDiff"](oldState, newState);

    expect(diffResult.diff).toEqual({
      message: "Hello World",
      toolUses: [{ tool: "A", input: "1" }],
      otherData: "ignore",
    });
    expect(diffResult.criticalChanges).toEqual({
      message: "Hello World",
      toolUses: [{ tool: "A", input: "1" }],
    });
  });

  it("should only mark changes in critical fields as critical", () => {
    const options = { criticalFields: ["message"] };
    const service = new ContextualStateDiffingV115Service(options);

    const oldState = {
      message: "Initial",
      toolUses: [{ tool: "A", input: "1" }],
      otherData: "old",
    };
    const newState = {
      message: "Updated",
      toolUses: [{ tool: "A", input: "1" }],
      otherData: "new",
    };

    const diffResult = service["calculateDiff"](oldState, newState);

    expect(diffResult.diff).toEqual({
      message: "Updated",
      toolUses: [{ tool: "A", input: "1" }],
      otherData: "new",
    });
    expect(diffResult.criticalChanges).toEqual({
      message: "Updated",
    });
  });

  it("should report no critical changes if only non-critical fields change", () => {
    const options = { criticalFields: ["message"] };
    const service = new ContextualStateDiffingV115Service(options);

    const oldState = {
      message: "Stable",
      toolUses: [{ tool: "A", input: "1" }],
      otherData: "old",
    };
    const newState = {
      message: "Stable",
      toolUses: [{ tool: "A", input: "1" }],
      otherData: "new_non_critical_data",
    };

    const diffResult = service["calculateDiff"](oldState, newState);

    expect(diffResult.diff).toEqual({
      message: "Stable",
      toolUses: [{ tool: "A", input: "1" }],
      otherData: "new_non_critical_data",
    });
    expect(diffResult.criticalChanges).toEqual({});
  });
});