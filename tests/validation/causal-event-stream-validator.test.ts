import { describe, it, expect } from "vitest";
import { validateCausalEventStream } from "../src/validation/causal-event-stream-validator";

describe("validateCausalEventStream", () => {
  it("should return no violations for a valid, causally ordered event stream", async () => {
    const events = [
      { id: "A", data: { value: 1 } },
      { id: "B", data: { value: 2 } },
      { id: "C", data: { value: 3 } },
    ];
    const context = {
      dependencies: new Map([
        ["B", ["A"]],
        ["C", ["A", "B"]],
      ]),
    };

    const violations = await validateCausalEventStream(events, context);
    expect(violations).toEqual([]);
  });

  it("should detect a causal violation when a dependent event occurs before its prerequisite", async () => {
    const events = [
      { id: "B", data: { value: 2 } }, // B depends on A
      { id: "A", data: { value: 1 } },
      { id: "C", data: { value: 3 } },
    ];
    const context = {
      dependencies: new Map([
        ["B", ["A"]],
        ["C", ["A", "B"]],
      ]),
    };

    const violations = await validateCausalEventStream(events, context);
    expect(violations).toHaveLength(1);
    expect(violations[0].violationType).toBe("Causal");
    expect(violations[0].violatedLink).toBe("B");
    expect(violations[0].message).toContain("requires A");
  });

  it("should detect a sequence violation when an event is missing a required prerequisite", async () => {
    const events = [
      { id: "A", data: { value: 1 } },
      { id: "C", data: { value: 3 } }, // C requires B, but B is missing
    ];
    const context = {
      dependencies: new Map([
        ["C", ["A", "B"]],
      ]),
    };

    const violations = await validateCausalEventStream(events, context);
    expect(violations).toHaveLength(1);
    expect(violations[0].violationType).toBe("Sequence");
    expect(violations[0].violatedLink).toBe("C");
    expect(violations[0].message).toContain("requires B");
  });
});