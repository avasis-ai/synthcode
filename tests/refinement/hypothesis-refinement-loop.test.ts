import { describe, it, expect } from "vitest";
import { HypothesisRefinementLoop, RefinementContext, Feedback } from "../src/refinement/hypothesis-refinement-loop";

describe("HypothesisRefinementLoop", () => {
  it("should refine the hypothesis when feedback indicates conflicts and unmet constraints", () => {
    const initialHypothesis: string = "The user needs a simple to-do list.";
    const history: Message[] = [{ role: "user", content: "I need a to-do list." }];
    const feedback: Feedback = {
      conflicts: ["The list must also integrate with a calendar."],
      unmetConstraints: ["It needs to support recurring tasks."],
      failureReport: "The current design doesn't account for calendar integration.",
      success: false,
    };
    const context: RefinementContext = {
      currentHypothesis: initialHypothesis,
      history: history,
      accumulatedFeedback: {
        conflicts: [],
        unmetConstraints: [],
        failureReport: null,
        success: true,
      },
    };

    const loop = new HypothesisRefinementLoop();
    const refinedHypothesis = loop.refine(context, feedback);

    expect(refinedHypothesis).toContain("to-do list");
    expect(refinedHypothesis).toContain("calendar integration");
    expect(refinedHypothesis).toContain("recurring tasks");
  });

  it("should maintain the hypothesis if feedback indicates success and no conflicts", () => {
    const initialHypothesis: string = "The user needs a simple to-do list.";
    const history: Message[] = [{ role: "user", content: "I need a to-do list." }];
    const feedback: Feedback = {
      conflicts: [],
      unmetConstraints: [],
      failureReport: null,
      success: true,
    };
    const context: RefinementContext = {
      currentHypothesis: initialHypothesis,
      history: history,
      accumulatedFeedback: {
        conflicts: [],
        unmetConstraints: [],
        failureReport: null,
        success: true,
      },
    };

    const loop = new HypothesisRefinementLoop();
    const refinedHypothesis = loop.refine(context, feedback);

    expect(refinedHypothesis).toBe(initialHypothesis);
  });

  it("should handle empty feedback gracefully and return the current hypothesis", () => {
    const initialHypothesis: string = "The user needs a simple to-do list.";
    const history: Message[] = [{ role: "user", content: "I need a to-do list." }];
    const feedback: Feedback = {
      conflicts: [],
      unmetConstraints: [],
      failureReport: null,
      success: true,
    };
    const context: RefinementContext = {
      currentHypothesis: initialHypothesis,
      history: history,
      accumulatedFeedback: {
        conflicts: [],
        unmetConstraints: [],
        failureReport: null,
        success: true,
      },
    };

    const loop = new HypothesisRefinementLoop();
    const refinedHypothesis = loop.refine(context, feedback);

    expect(refinedHypothesis).toBe(initialHypothesis);
  });
});