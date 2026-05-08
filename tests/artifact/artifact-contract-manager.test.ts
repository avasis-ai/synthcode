import { describe, it, expect } from "vitest";
import { ArtifactContractManager } from "../src/artifact/artifact-contract-manager";

describe("ArtifactContractManager", () => {
  it("should correctly create an instance with a valid contract", () => {
    const contract: ArtifactContract = {
      id: "test-artifact-id",
      schema: {
        requiredFields: ["name", "version"],
        fieldTypes: {
          name: "string",
          version: "number",
        },
      },
    };
    const manager = new ArtifactContractManager(contract);
    expect(manager).toBeInstanceOf(ArtifactContractManager);
    expect(manager.getContractId()).toBe(contract.id);
  });

  it("should validate and return true for a valid artifact data object", () => {
    const contract: ArtifactContract = {
      id: "test-artifact-id",
      schema: {
        requiredFields: ["name", "description"],
        fieldTypes: {
          name: "string",
          description: "string",
        },
      },
    };
    const manager = new ArtifactContractManager(contract);
    const validData = {
      name: "Test Artifact",
      description: "A test description",
    };
    expect(manager.isValid(validData)).toBe(true);
  });

  it("should validate and return false for an artifact data object missing required fields", () => {
    const contract: ArtifactContract = {
      id: "test-artifact-id",
      schema: {
        requiredFields: ["name", "description", "owner"],
        fieldTypes: {
          name: "string",
          description: "string",
          owner: "string",
        },
      },
    };
    const manager = new ArtifactContractManager(contract);
    const invalidData = {
      name: "Test Artifact",
      description: "A test description",
    };
    expect(manager.isValid(invalidData)).toBe(false);
  });
});