import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type ArtifactId = string;

interface ContractSchema {
  requiredFields: string[];
  fieldTypes: Record<string, "string" | "number" | "boolean" | "object">;
  // Add more complex validation rules if needed, but keeping it simple for now
}

interface ArtifactContract {
  id: ArtifactId;
  schema: ContractSchema;
}

export class ArtifactContractManager {
  private contracts: Map<ArtifactId, ArtifactContract> = new Map();

  registerContract(contract: ArtifactContract): void {
    if (this.contracts.has(contract.id)) {
      throw new Error(`Contract for artifact ID "${contract.id}" is already registered.`);
    }
    this.contracts.set(contract.id, contract);
  }

  validateArtifact(artifact: Record<string, unknown>, artifactId: ArtifactId): { isValid: boolean; errors: string[] } {
    const contract = this.contracts.get(artifactId);
    if (!contract) {
      return { isValid: false, errors: [`No contract registered for artifact ID: ${artifactId}`] };
    }

    const errors: string[] = [];
    const schema = contract.schema;

    // 1. Check required fields
    for (const field of schema.requiredFields) {
      if (!(field in artifact)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // 2. Check types for present fields
    for (const field of schema.requiredFields) {
      if (field in artifact) {
        const expectedType = schema.fieldTypes[field];
        const actualValue = artifact[field];

        if (expectedType === "string" && typeof actualValue !== 'string') {
          errors.push(`Field "${field}" expected type string, got ${typeof actualValue}`);
        } else if (expectedType === "number" && typeof actualValue !== 'number') {
          errors.push(`Field "${field}" expected type number, got ${typeof actualValue}`);
        } else if (expectedType === "boolean" && typeof actualValue !== 'boolean') {
          errors.push(`Field "${field}" expected type boolean, got ${typeof actualValue}`);
        } else if (expectedType === "object" && (typeof actualValue !== 'object' || actualValue === null || Array.isArray(actualValue))) {
          errors.push(`Field "${field}" expected type object, got ${typeof actualValue}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}