import { describe, it, expect } from "vitest";
import { MessageContractRegistry } from "../src/validation/inter-agent-message-contract-validator";

describe("MessageContractRegistry", () => {
  it("should initialize and allow registration of contracts", () => {
    const registry = new MessageContractRegistry();
    const contractId = "test-contract";
    const mockContract = {
      schema: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
        },
      },
      rules: [],
    };
    registry.registerContract(contractId, mockContract);
    // We can't directly test the private map, but we can test the getter
    expect(registry.getContract(contractId)).toBeDefined();
  });

  it("should return undefined for non-existent contract IDs", () => {
    const registry = new MessageContractRegistry();
    expect(registry.getContract("non-existent-id")).toBeUndefined();
  });

  it("should handle multiple contract registrations without conflict", () => {
    const registry = new MessageContractRegistry();
    const contract1 = {
      schema: {
        type: "object",
        properties: {
          field1: {
            type: "string",
          },
        },
      },
      rules: [],
    };
    const contract2 = {
      schema: {
        type: "object",
        properties: {
          field2: {
            type: "number",
          },
        },
      },
      rules: [],
    };
    registry.registerContract("contract-a", contract1);
    registry.registerContract("contract-b", contract2);
    expect(registry.getContract("contract-a")).toEqual(contract1);
    expect(registry.getContract("contract-b")).toEqual(contract2);
  });
});