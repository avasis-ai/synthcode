import { describe, it, expect } from "vitest"
import { ContractStep, FailureMode } from "../src/contract/inter-agent-communication-contract.js"

describe("Inter-Agent Communication Contract", () => {
  it("should correctly define the structure and types for contract steps", async () => {
    // Arrange: Mock a simple contract step structure
    const mockStep: ContractStep = {
      description: "Initial context gathering",
      requiredInputContext: {
        userQuery: "What is the weather?",
        location: "New York",
      },
      primaryCall: async (context) => {
        expect(context).toHaveProperty("userQuery")
        expect(context).toHaveProperty("location")
        return {
          success: true,
          output: {
            weatherForecast: "Sunny",
            unit: "Fahrenheit",
          },
        }
      },
    }

    // Act & Assert
    expect(mockStep.description).toBe("Initial context gathering")
    expect(typeof mockStep.requiredInputContext).toBe("object")
    expect(typeof mockStep.primaryCall).toBe("function")

    // Test the primaryCall execution logic
    const result = await mockStep.primaryCall({
      userQuery: "What is the weather?",
      location: "New York",
    })
    expect(result.success).toBe(true)
    expect(result.output).toHaveProperty("weatherForecast")
  })

  it("should handle failure modes correctly when defining fallback logic", async () => {
    // Arrange: Mock a contract step that fails and defines fallback
    const mockStep: ContractStep = {
      description: "Attempting complex task",
      requiredInputContext: {
        data: "some data",
      },
      primaryCall: async (context) => {
        // Simulate primary failure
        return {
          success: false,
          failureMode: FailureMode.FALLBACK_TO_AGENT_B,
          reason: "Primary agent failed due to missing data.",
        }
      },
    }

    // Act & Assert
    const result = await mockStep.primaryCall({
      data: "some data",
    })
    expect(result.success).toBe(false)
    expect(result.failureMode).toBe(FailureMode.FALLBACK_TO_AGENT_B)
    expect(result.reason).toBe("Primary agent failed due to missing data.")
  })

  it("should allow for escalation to human review as a final failure mode", async () => {
    // Arrange: Mock a step that requires human intervention
    const mockStep: ContractStep = {
      description: "Reviewing ambiguous input",
      requiredInputContext: {
        input: "Ambiguous request.",
      },
      primaryCall: async (context) => {
        // Simulate escalation
        return {
          success: false,
          failureMode: FailureMode.ESCALATE_TO_HUMAN,
          reason: "Input requires human clarification.",
        }
      },
    }

    // Act & Assert
    const result = await mockStep.primaryCall({
      input: "Ambiguous request.",
    })
    expect(result.success).toBe(false)
    expect(result.failureMode).toBe(FailureMode.ESCALATE_TO_HUMAN)
    expect(result.reason).toContain("human clarification")
  })
})