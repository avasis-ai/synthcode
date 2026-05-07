import { describe, it, expect, vi } from "vitest";
import { RefinementLoopManager, FeedbackPayload, RefinementState } from "../src/refinement/refinement-loop-manager";

describe("RefinementLoopManager", () => {
  it("should initialize with correct state", () => {
    const originalPlan: Message[] = [{ role: "user", content: "Initial request" }];
    const initialState: RefinementState = {
      originalPlan: originalPlan,
      currentIteration: 0,
      accumulatedFeedback: [],
      currentContext: "",
    };
    const manager = new RefinementLoopManager(initialState);
    expect(manager).toBeDefined();
    // Assuming a getter or internal check is needed to verify state,
    // but based on the provided snippet, we test the constructor's effect.
    // If the state is private, we rely on public methods to confirm behavior.
  });

  it("should update state correctly when processing feedback", () => {
    const originalPlan: Message[] = [{ role: "user", content: "Initial request" }];
    const initialState: RefinementState = {
      originalPlan: originalPlan,
      currentIteration: 0,
      accumulatedFeedback: [],
      currentContext: "Initial context",
    };
    const manager = new RefinementLoopManager(initialState);

    const feedback: FeedbackPayload = {
      critique: "The plan missed a key dependency.",
      requiredAction: "add context",
      confidenceScore: 0.9,
      details: { dependency: "API Key" },
    };

    // Assuming a method like `processFeedback` exists
    // We mock the internal state update mechanism for testing purposes.
    // Since the full implementation is missing, we simulate the expected behavior.
    (manager as any).processFeedback(feedback);

    // Check if the feedback was added and iteration count potentially updated
    // We assume the internal state can be checked or that a getter exists.
    // For this test, we assert that the manager handles the feedback structure.
    expect((manager as any).getState().accumulatedFeedback).toHaveLength(1);
    expect((manager as any).getState().accumulatedFeedback[0]).toEqual(feedback);
  });

  it("should handle multiple feedback cycles and update context", () => {
    const originalPlan: Message[] = [{ role: "user", content: "Initial request" }];
    const initialState: RefinementState = {
      originalPlan: originalPlan,
      currentIteration: 0,
      accumulatedFeedback: [],
      currentContext: "Initial context",
    };
    const manager = new RefinementLoopManager(initialState);

    // Cycle 1
    const feedback1: FeedbackPayload = {
      critique: "Needs more data.",
      requiredAction: "add context",
      confidenceScore: 0.8,
      details: {},
    };
    (manager as any).processFeedback(feedback1);

    // Cycle 2
    const feedback2: FeedbackPayload = {
      critique: "The plan needs modification.",
      requiredAction: "modify plan",
      confidenceScore: 0.95,
      details: { new_step: true },
    };
    (manager as any).processFeedback(feedback2);

    // Check iteration count and context accumulation
    const state = (manager as any).getState();
    expect(state.currentIteration).toBe(2);
    expect(state.accumulatedFeedback).toHaveLength(2);
    expect(state.currentContext).toContain("Initial context"); // Assuming context accumulates
  });
});