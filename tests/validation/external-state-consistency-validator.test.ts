import { describe, it, expect } from "vitest"
import { ExternalValidator } from "../src/validation/external-state-consistency-validator"

describe("ExternalStateConsistencyValidator", () => {
  it("should correctly validate consistency when all external states are consistent", async () => {
    const mockValidator = {
      name: "MockValidator",
      validate: async (payload) => ({
        validatorName: "MockValidator",
        isValid: true,
        message: "State is consistent.",
        severity: "INFO",
        remediationSteps: [],
      }),
    }
    const validator = new ExternalValidator([mockValidator])
    const result = await validator.validate({ key: "value" })
    expect(result.isConsistent).toBe(true)
    expect(result.details.length).toBe(1)
    expect(result.summary).toContain("All external states are consistent")
  })

  it("should identify inconsistency and provide details when one external state fails validation", async () => {
    const mockValidator = {
      name: "MockValidator",
      validate: async (payload) => ({
        validatorName: "MockValidator",
        isValid: false,
        message: "External state mismatch detected.",
        severity: "ERROR",
        remediationSteps: ["Update external system X"],
      }),
    }
    const validator = new ExternalValidator([mockValidator])
    const result = await validator.validate({ key: "value" })
    expect(result.isConsistent).toBe(false)
    expect(result.details.length).toBe(1)
    expect(result.details[0].isValid).toBe(false)
    expect(result.summary).toContain("Inconsistency detected")
  })

  it("should aggregate results and remain consistent if multiple validators pass", async () => {
    const mockValidator1 = {
      name: "ValidatorA",
      validate: async (payload) => ({
        validatorName: "ValidatorA",
        isValid: true,
        message: "A is fine.",
        severity: "INFO",
        remediationSteps: [],
      }),
    }
    const mockValidator2 = {
      name: "ValidatorB",
      validate: async (payload) => ({
        validatorName: "ValidatorB",
        isValid: true,
        message: "B is fine.",
        severity: "INFO",
        remediationSteps: [],
      }),
    }
    const validator = new ExternalValidator([mockValidator1, mockValidator2])
    const result = await validator.validate({ key: "value" })
    expect(result.isConsistent).toBe(true)
    expect(result.details.length).toBe(2)
    expect(result.summary).toContain("All external states are consistent")
  })
})