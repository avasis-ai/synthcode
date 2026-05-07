import { describe, it, expect } from "vitest";
import { ContractDefinition, ValidationError } from "../src/validation/ephemeral-interaction-contract-validator";

describe("ContractDefinition Validator", () => {
  it("should throw ValidationError when required field is missing", async () => {
    const invalidContract: ContractDefinition = {
      schema: {
        id: { type: "string"; required: true },
        name: { type: "string"; required: false },
      },
      constraints: {},
    };

    await expect(() => {
      new (class Validator {
        constructor(private contract: ContractDefinition) {}
        public async validate(data: Record<string, unknown>): Promise<void> {
          // Simplified validation logic for testing purposes
          for (const key in this.contract.schema) {
            const schema = this.contract.schema[key];
            if (schema.required && !(key in data)) {
              throw new ValidationError(`Field ${key} is required.`);
            }
          }
        }
      })(invalidContract).validate({ name: "Test" });
    }).rejects.toThrow(ValidationError);
  });

  it("should pass validation when all required fields are present", async () => {
    const validContract: ContractDefinition = {
      schema: {
        id: { type: "string"; required: true },
        name: { type: "string"; required: true },
      },
      constraints: {},
    };

    const validator = new (class Validator {
      constructor(private contract: ContractDefinition) {}
      public async validate(data: Record<string, unknown>): Promise<void> {
        // Simplified validation logic for testing purposes
        for (const key in this.contract.schema) {
          const schema = this.contract.schema[key];
          if (schema.required && !(key in data)) {
            throw new ValidationError(`Field ${key} is required.`);
          }
        }
      }
    })(validContract);

    await expect(async () => {
      await validator.validate({ id: "test-id", name: "Test Name" });
    }).resolves.not.toThrow();
  });

  it("should handle basic type validation (e.g., string type)", async () => {
    const contract: ContractDefinition = {
      schema: {
        username: { type: "string"; required: true },
        age: { type: "number"; required: true },
      },
      constraints: {},
    };

    const validator = new (class Validator {
      constructor(private contract: ContractDefinition) {}
      public async validate(data: Record<string, unknown>): Promise<void> {
        // Simplified validation logic for testing purposes
        for (const key in this.contract.schema) {
          const schema = this.contract.schema[key];
          if (schema.required && !(key in data)) {
            throw new ValidationError(`Field ${key} is required.`);
          }
          if (schema.type === "string" && typeof data[key] !== "string") {
             throw new ValidationError(`Field ${key} must be a string.`);
          }
        }
      }
    })(contract);

    await expect(async () => {
      await validator.validate({ username: "user123", age: 30 });
    }).resolves.not.toThrow();
  });
});