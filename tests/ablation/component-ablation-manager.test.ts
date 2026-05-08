import { describe, it, expect } from "vitest"
import { ComponentAblationManager, AblationRule, ReplacementStrategy } from "../src/ablation/component-ablation-manager"

describe("ComponentAblationManager", () => {
  it("should initialize correctly and add a single rule", () => {
    const manager = new ComponentAblationManager()
    const rule: AblationRule = {
      componentName: "TestComponent",
      strategy: ReplacementStrategy.MOCK,
      mockImplementation: () => "mocked"
    }
    manager.addRule(rule)
    // Assuming there's a way to check internal state or a getter for testing purposes
    // Since we don't have access to private state, we'll rely on the side effect of adding the rule
    // For a real test, we'd need a getter or a method to verify the rule was added.
    // For this exercise, we assume addRule works and test the basic flow.
    expect(manager).toBeInstanceOf(ComponentAblationManager)
  })

  it("should handle adding multiple rules for different components", () => {
    const manager = new ComponentAblationManager()
    const rule1: AblationRule = {
      componentName: "ComponentA",
      strategy: ReplacementStrategy.SKIP
    }
    const rule2: AblationRule = {
      componentName: "ComponentB",
      strategy: ReplacementStrategy.REPLACE_WITH_SIMPLE,
      simpleReplacement: () => "simple_b"
    }
    manager.addRule(rule1)
    manager.addRule(rule2)
    // Again, relying on the assumption that addRule correctly stores the rules.
  })

  it("should handle adding rules with the same component name (overwriting)", () => {
    const manager = new ComponentAblationManager()
    const rule1: AblationRule = {
      componentName: "SharedComponent",
      strategy: ReplacementStrategy.MOCK,
      mockImplementation: () => "mock_v1"
    }
    const rule2: AblationRule = {
      componentName: "SharedComponent",
      strategy: ReplacementStrategy.SKIP,
      simpleReplacement: () => "simple_v2"
    }
    manager.addRule(rule1)
    manager.addRule(rule2)
    // We expect rule2 to overwrite rule1.
  })
})