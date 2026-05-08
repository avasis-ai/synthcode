import { describe, it, expect } from "vitest"
import { AdversarialTestRunner } from "../src/adversarial/adversarial-test-runner"

describe("AdversarialTestRunner", () => {
  it("should run a basic adversarial scenario and report success", async () => {
    const runner = new AdversarialTestRunner()
    const scenario = {
      description: "Basic injection attempt",
      attackVector: "prompt_injection",
      expectedFailureType: "injection",
    }
    const result = await runner.runScenario(scenario, "dummy_model_response")
    expect(result.success).toBe(false)
    expect(result.capturedState).toHaveProperty("logs")
  })

  it("should handle a scenario expecting resource exhaustion failure", async () => {
    const runner = new AdversarialTestRunner()
    const scenario = {
      description: "Resource exhaustion test",
      attackVector: "long_prompt",
      expectedFailureType: "resource_exhaustion",
    }
    const result = await runner.runScenario(scenario, "dummy_model_response")
    expect(result.success).toBe(false)
    expect(result.scenario.expectedFailureType).toBe("resource_exhaustion")
  })

  it("should correctly process and report data malformation failures", async () => {
    const runner = new AdversarialTestRunner()
    const scenario = {
      description: "Data malformation test",
      attackVector: "malformed_input",
      expectedFailureType: "data_malformation",
    }
    const result = await runner.runScenario(scenario, "dummy_model_response")
    expect(result.success).toBe(false)
    expect(result.capturedState).toHaveProperty("logs")
  })
})