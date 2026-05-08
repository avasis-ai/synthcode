import { describe, it, expect } from "vitest";
import { ExternalApiContractGuardian } from "../src/governance/external-api-contract-guardian.js";

describe("ExternalApiContractGuardian", () => {
  it("should correctly validate a simple GET endpoint contract", () => {
    const guardian = new ExternalApiContractGuardian();
    const contract = {
      method: "GET",
      path: "/users/{id}",
      parameters: {
        id: { type: "string", required: true, description: "User ID" },
      },
      headers: [],
      responseSchema: {
        success: { type: "object", description: "User data" },
      },
    };
    expect(guardian.validateContract(contract)).toBe(true);
  });

  it("should detect missing required parameters in the contract", () => {
    const guardian = new ExternalApiContractGuardian();
    const contract = {
      method: "POST",
      path: "/create",
      parameters: {
        data: { type: "object", required: true, description: "Payload data" },
      },
      headers: [],
      responseSchema: {},
    };
    // Simulate a scenario where 'data' is missing or invalidly defined
    const invalidContract = {
      method: "POST",
      path: "/create",
      parameters: {}, // Missing required 'data' parameter
      headers: [],
      responseSchema: {},
    };
    expect(guardian.validateContract(invalidContract)).toBe(false);
  });

  it("should detect invalid method type in the contract", () => {
    const guardian = new ExternalApiContractGuardian();
    const invalidContract = {
      method: "PATCH", // Invalid method
      path: "/resource",
      parameters: {},
      headers: [],
      responseSchema: {},
    };
    expect(guardian.validateContract(invalidContract)).toBe(false);
  });
});