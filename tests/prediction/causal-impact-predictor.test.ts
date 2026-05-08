import { describe, it, expect } from "vitest";
import { CausalImpactPredictor, SystemContext, ProposedAction, ImpactType } from "../src/prediction/causal-impact-predictor";

describe("CausalImpactPredictor", () => {
  it("should predict a conflict when proposed action violates constraints", async () => {
    const context: SystemContext = {
      current_state: {
        resource_a: 10,
        resource_b: 5,
      },
      goals: ["Maximize resource usage"],
      constraints: ["resource_a must remain >= 5"],
      dependency_graph: new Map([
        ["A", new Set(["B"])],
      ]),
    };

    const action: ProposedAction = {
      type: "tool_call",
      tool_name: "consume_resource",
      input: { resource: "resource_a", amount: 6 },
    };

    const predictor = new CausalImpactPredictor();
    const result = await predictor.predictImpact(context, action);

    expect(result.impact_type).toBe("VIOLATION");
    expect(result.details).toContain("resource_a must remain >= 5");
  });

  it("should predict a state change when proposed action modifies state", async () => {
    const context: SystemContext = {
      current_state: {
        user_count: 100,
        session_active: true,
      },
      goals: ["Maintain system stability"],
      constraints: ["user_count must be positive"],
      dependency_graph: new Map(),
    };

    const action: ProposedAction = {
      type: "tool_call",
      tool_name: "update_user_count",
      input: { new_count: 90 },
    };

    const predictor = new CausalImpactPredictor();
    const result = await predictor.predictImpact(context, action);

    expect(result.impact_type).toBe("STATE_CHANGE");
    expect(result.details).toContain("user_count changed from 100 to 90");
  });

  it("should predict no significant impact when proposed action is benign", async () => {
    const context: SystemContext = {
      current_state: {
        temperature: 25,
        system_status: "OK",
      },
      goals: ["Maintain optimal temperature"],
      constraints: ["temperature must be between 20 and 30"],
      dependency_graph: new Map(),
    };

    const action: ProposedAction = {
      type: "tool_call",
      tool_name: "log_event",
      input: { event: "System check completed" },
    };

    const predictor = new CausalImpactPredictor();
    const result = await predictor.predictImpact(context, action);

    expect(result.impact_type).toBe("NONE");
    expect(result.details).toContain("No significant impact detected");
  });
});