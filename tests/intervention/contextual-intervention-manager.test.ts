import { describe, it, expect, vi } from "vitest";
import {
  ContextualInterventionManager,
  Intervention,
  AgentContext,
} from "../src/intervention/contextual-intervention-manager";

describe("ContextualInterventionManager", () => {
  it("should initialize correctly with default context and interventions", async () => {
    const mockContext: AgentContext = {
      history: [
        { type: "user", content: [{ type: "text", text: "Hello" }] },
      ],
      current_state: { user_id: "123" },
      last_action: "user_input",
    };
    const manager = new ContextualInterventionManager(mockContext);

    expect(manager).toBeDefined();
    expect(manager.context).toEqual(mockContext);
    expect(manager.interventions).toHaveLength(0);
  });

  it("should add and sort interventions based on priority and confidence", async () => {
    const mockContext: AgentContext = {
      history: [],
      current_state: {},
      last_action: "system",
    };
    const manager = new ContextualInterventionManager(mockContext);

    const intervention1: Intervention = {
      source: "human",
      proposed_change: { key: "value" },
      priority: 5,
      confidence: 0.8,
      message: "High priority human suggestion",
    };
    const intervention2: Intervention = {
      source: "system",
      proposed_change: { key: "value" },
      priority: 10,
      confidence: 0.95,
      message: "Critical system update",
    };
    const intervention3: Intervention = {
      source: "external_api",
      proposed_change: { key: "value" },
      priority: 5,
      confidence: 0.5,
      message: "Low confidence external suggestion",
    };

    manager.addIntervention(intervention1);
    manager.addIntervention(intervention2);
    manager.addIntervention(intervention3);

    // The sorting logic should prioritize higher priority, then higher confidence
    expect(manager.interventions).toHaveLength(3);
    expect(manager.interventions[0]).toEqual(intervention2); // Priority 10
    expect(manager.interventions[1]).toEqual(intervention1); // Priority 5, Confidence 0.8
    expect(manager.interventions[2]).toEqual(intervention3); // Priority 5, Confidence 0.5
  });

  it("should retrieve the highest priority intervention and apply its proposed change", async () => {
    const mockContext: AgentContext = {
      history: [],
      current_state: { theme: "dark" },
      last_action: "system",
    };
    const manager = new ContextualInterventionManager(mockContext);

    const intervention: Intervention = {
      source: "human",
      proposed_change: { theme: "light", user_id: "new_id" },
      priority: 8,
      confidence: 0.9,
      message: "Change theme and user ID",
    };

    manager.addIntervention(intervention);
    const bestIntervention = manager.getBestIntervention();

    expect(bestIntervention).toEqual(intervention);
    expect(manager.applyIntervention()).toEqual({
      success: true,
      message: "Intervention applied successfully.",
      applied_changes: { theme: "light", user_id: "new_id" },
    });

    // Verify that the context state was updated
    expect(manager.context.current_state).toEqual({
      theme: "light",
      user_id: "new_id",
    });
  });
});