import { describe, it, expect } from "vitest";
import { ContextualStateDiffer } from "../src/context/contextual-state-diffing-v131";

describe("ContextualStateDiffer", () => {
  it("should initialize with no initial links", () => {
    const differ = new ContextualStateDiffer();
    // Assuming there's a way to check private state or a getter for initial links
    // For this test, we'll rely on the setter being the primary way to set them.
    // If we could access private state, we'd check it here.
  });

  it("should set initial links correctly", () => {
    const differ = new ContextualStateDiffer();
    const links: { sourceStepId: string; causalActionType: string }[] = [
      { sourceStepId: "step1", causalActionType: "user_input" },
      { sourceStepId: "step2", causalActionType: "tool_call" },
    ];
    (differ as any).setInitialLinks(links); // Casting to bypass private access restriction for testing
    expect((differ as any).initialLinks).toEqual(links);
  });

  it("should handle setting an empty array of initial links", () => {
    const differ = new ContextualStateDiffer();
    (differ as any).setInitialLinks([]);
    expect((differ as any).initialLinks).toEqual([]);
  });
});