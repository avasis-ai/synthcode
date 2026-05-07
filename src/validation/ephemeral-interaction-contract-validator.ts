import { Message } from "./types";

interface Schema {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object";
    required: boolean;
    minLength?: number;
    maxLength?: number;
    enum?: string[];
  };
}

interface Constraints {
  [key: string]: {
    validate: (value: unknown) => boolean;
    message: string;
  };
}

export interface ContractDefinition {
  schema: Schema;
  constraints: Constraints;
}

class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class EphemeralInteractionContractValidator {
  private contract: ContractDefinition;

  constructor(contract: ContractDefinition) {
    this.contract = contract;
  }

  private validateSchema(data: Record<string, unknown>): void {
    const schema = this.contract.schema;
    for (const key in schema) {
      const fieldSchema = schema[key];
      const value = data[key];

      if (fieldSchema.required && value === undefined) {
        throw new ValidationError(`Missing required field: ${key}`, key);
      }

      if (value !== undefined) {
        switch (fieldSchema.type) {
          case "string":
            if (typeof value !== "string") {
              throw new ValidationError(`Expected string for field: ${key}`, key);
            }
            if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
              throw new ValidationError(`String too short for field: ${key}`, key);
            }
            if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
              throw new ValidationError(`String too long for field: ${key}`, key);
            }
            break;
          case "number":
            if (typeof value !== "number") {
              throw new ValidationError(`Expected number for field: ${key}`, key);
            }
            break;
          case "boolean":
            if (typeof value !== "boolean") {
              throw new ValidationError(`Expected boolean for field: ${key}`, key);
            }
            break;
          case "object":
            if (typeof value !== "object" || value === null || Array.isArray(value)) {
              throw new ValidationError(`Expected object for field: ${key}`, key);
            }
            break;
        }
      }
    }
  }

  private validateConstraints(data: Record<string, unknown>): void {
    const constraints = this.contract.constraints;
    for (const key in constraints) {
      const constraint = constraints[key];
      const value = data[key];

      if (value !== undefined) {
        if (!constraint.validate(value)) {
          throw new ValidationError(constraint.message, key);
        }
      }
    }
  }

  public validate(payload: Record<string, unknown>): void {
    this.validateSchema(payload);
    this.validateConstraints(payload);
  }
}

export class ValidatorManager {
  private contracts: Map<string, ContractDefinition> = new Map();

  defineContract(interactionId: string, contract: ContractDefinition): void {
    this.contracts.set(interactionId, contract);
  }

  getContract(interactionId: string): ContractDefinition | undefined {
    return this.contracts.get(interactionId);
  }

  getValidator(interactionId: string): EphemeralInteractionContractValidator | undefined {
    const contract = this.getContract(interactionId);
    return contract ? new EphemeralInteractionContractValidator(contract) : undefined;
  }

  clearContract(interactionId: string): void {
    this.contracts.delete(interactionId);
  }
}