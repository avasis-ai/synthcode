import { Message } from "./message-types";

type Schema = Record<string, any>;

interface ValidationRule {
  check: (message: Message) => boolean;
  description: string;
}

interface MessageContract {
  schema: Schema;
  rules: ValidationRule[];
}

class MessageContractRegistry {
  private contracts: Map<string, MessageContract> = new Map();

  registerContract(contractId: string, contract: MessageContract): void {
    this.contracts.set(contractId, contract);
  }

  getContract(contractId: string): MessageContract | undefined {
    return this.contracts.get(contractId);
  }
}

export class InterAgentMessageContractValidator {
  private registry: MessageContractRegistry;

  constructor(registry: MessageContractRegistry) {
    this.registry = registry;
  }

  private validateSchema(message: Message, schema: Schema): boolean {
    // Placeholder for complex JSON schema validation logic
    // In a real system, this would use a library like Ajv.
    if (typeof schema.requiredFields !== 'undefined') {
      for (const field of schema.requiredFields) {
        if (!('role' in message) || !message['role']) {
          return false;
        }
      }
    }
    return true;
  }

  private validateSemantics(message: Message, contractId: string): boolean {
    // Placeholder for semantic checks (e.g., checking if tool_use_id exists if role is 'tool')
    if (message.role === 'tool' && !('tool_use_id' in message) || !message['tool_use_id']) {
      return false;
    }
    return true;
  }

  private validateBehavioralRules(message: Message, rules: ValidationRule[]): boolean {
    for (const rule of rules) {
      if (!rule.check(message)) {
        return false;
      }
    }
    return true;
  }

  validate(message: Message, contractId: string): { isValid: boolean; errors: string[] } {
    const contract = this.registry.getContract(contractId);
    if (!contract) {
      return { isValid: false, errors: [`No contract found for ID: ${contractId}`] };
    }

    const errors: string[] = [];

    // 1. Schema Validation
    if (!this.validateSchema(message, contract.schema)) {
      errors.push("Schema validation failed: Message structure does not match contract requirements.");
    }

    // 2. Semantic Validation
    if (!this.validateSemantics(message, contractId)) {
      errors.push("Semantic validation failed: Message content violates expected meaning (e.g., missing required IDs).");
    }

    // 3. Behavioral Rule Validation
    if (!this.validateBehavioralRules(message, contract.rules)) {
      errors.push("Behavioral validation failed: Message violates defined operational rules.");
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }
}