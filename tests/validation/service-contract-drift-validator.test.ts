import { describe, it, expect } from "vitest"
import { ServiceContract } from "../src/validation/service-contract-drift-validator"

describe("ServiceContract", () => {
  it("should validate a simple contract with basic types", () => {
    const contract = {
      user_id: { required: true, type: "number" },
      username: { required: true, type: "string" },
      is_active: { required: false, type: "boolean" },
    }
    const result = ServiceContract.validate(contract)
    expect(result).toBe(true)
  })

  it("should validate a contract with nested objects and required fields", () => {
    const contract = {
      user_profile: {
        required: true,
        type: "object",
        properties: {
          email: { required: true, type: "string" },
          age: { required: false, type: "number" },
        },
      },
    }
    const result = ServiceContract.validate(contract)
    expect(result).toBe(true)
  })

  it("should fail validation when a required field is missing", () => {
    const contract = {
      user_id: { required: true, type: "number" },
      username: { required: true, type: "string" },
    }
    // Simulate missing 'username' in the validation process
    const invalidContract = {
      user_id: { required: true, type: "number" },
      // username is missing
    }
    const result = ServiceContract.validate(invalidContract)
    expect(result).toBe(false)
  })
})