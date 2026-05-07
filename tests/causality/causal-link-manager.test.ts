import { describe, it, expect } from "vitest"
import { CausalLinkManager, CausalLink } from "../src/causality/causal-link-manager"

describe("CausalLinkManager", () => {
  it("should validate a simple successful causal link", () => {
    const requiredLinks: CausalLink[] = [
      { prerequisiteId: "A", requiredType: "tool_result", description: "Tool A must run" },
    ]
    const manager = new CausalLinkManager(requiredLinks)
    const result = manager.validate(
      "A",
      "tool_result",
      "Some tool output"
    )
    expect(result).toBe(true)
  })

  it("should detect a missing required causal link", () => {
    const requiredLinks: CausalLink[] = [
      { prerequisiteId: "B", requiredType: "state_transition", description: "State B must change" },
    ]
    const manager = new CausalLinkManager(requiredLinks)
    const result = manager.validate(
      "A",
      "tool_result",
      "Some output"
    )
    expect(result).toBe(false)
  })

  it("should detect an incorrect type for a required causal link", () => {
    const requiredLinks: CausalLink[] = [
      { prerequisiteId: "C", requiredType: "user_input", description: "User must input" },
    ]
    const manager = new CausalLinkManager(requiredLinks)
    const result = manager.validate(
      "A",
      "tool_result",
      "Some output"
    )
    expect(result).toBe(false)
  })
})