import { describe, it, expect } from "vitest";
import { ContextualConstraintPropagator } from "../src/context/contextual-constraint-propagator";

describe("ContextualConstraintPropagator", () => {
  it("should propagate a temporal constraint correctly when a new message is added", async () => {
    const initialContext: Context = {
      messages: [{ role: "user", content: "Start process" }],
      constraints: [{ type: "temporal", description: "Must finish by EOD", severity: "error", details: { deadline: "2024-12-31" } }],
      state: {}
    };
    const propagator = new ContextualConstraintPropagator();
    const newContext = await propagator.propagate(initialContext, { role: "assistant", content: "Processing..." });

    expect(newContext.constraints).toHaveLength(1);
    expect(newContext.constraints[0].type).toBe("temporal");
  });

  it("should merge or update constraints when a resource constraint is encountered", async () => {
    const initialContext: Context = {
      messages: [{ role: "user", content: "Need resource X" }],
      constraints: [{ type: "resource", description: "Resource X required", severity: "warning", details: { name: "X", limit: 1 } }],
      state: {}
    };
    const propagator = new ContextualConstraintPropagator();
    const newContext = await propagator.propagate(initialContext, { role: "system", content: "Confirm resource X availability." });

    expect(newContext.constraints).toHaveLength(1);
    expect(newContext.constraints[0].type).toBe("resource");
    expect(newContext.constraints[0].details).toEqual({ name: "X", limit: 1 });
  });

  it("should maintain existing constraints when no new constraints are implied", async () => {
    const initialContext: Context = {
      messages: [{ role: "user", content: "Initial query" }],
      constraints: [{ type: "schema", description: "Schema V1", severity: "error", details: { schema: "v1" } }],
      state: {}
    };
    const propagator = new ContextualConstraintPropagator();
    const newContext = await propagator.propagate(initialContext, { role: "user", content: "Follow up question." });

    expect(newContext.constraints).toHaveLength(1);
    expect(newContext.constraints[0].type).toBe("schema");
    expect(newContext.constraints[0].details).toEqual({ schema: "v1" });
  });
});