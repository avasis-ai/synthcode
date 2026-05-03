import { describe, it, expect } from "vitest";
import { StructuredThoughtLogger } from "../src/logging/structured-thought-logger";

describe("StructuredThoughtLogger", () => {
  it("should initialize with no thoughts", () => {
    const logger = new StructuredThoughtLogger();
    expect(logger.getThoughts()).toEqual([]);
  });

  it("should record a thought and return it in getThoughts", () => {
    const logger = new StructuredThoughtLogger();
    const thought1 = { type: "thought", reasoning: "Initial thought" };
    const thought2 = { type: "thought", reasoning: "Second thought", plan: "Plan A" };

    logger.recordThought(thought1);
    logger.recordThought(thought2);

    const thoughts = logger.getThoughts();
    expect(thoughts.length).toBe(2);
    expect(thoughts[0]).toEqual(thought1);
    expect(thoughts[1]).toEqual(thought2);
  });

  it("should clear all recorded thoughts", () => {
    const logger = new StructuredThoughtLogger();
    const thought1 = { type: "thought", reasoning: "Thought to be cleared" };
    logger.recordThought(thought1);
    logger.recordThought({ type: "thought", reasoning: "Another thought" });

    logger.clearThoughts();
    expect(logger.getThoughts()).toEqual([]);
  });
});