import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type ContractInputs = Record<string, unknown>;

export interface ContractSLAs {
  maxExecutionTimeMs: number;
  minRequiredResources: Record<string, number>;
}

export interface ContractSideEffects {
  allowedActions: string[];
  requiredPermissions: string[];
}

export interface CapabilityContract {
  toolName: string;
  description: string;
  requiredInputs: Record<string, { type: string; required: boolean }>;
  slas: ContractSLAs;
  sideEffects: ContractSideEffects;
}

export type ExecutionContext = {
  currentSessionId: string;
  userContext: Record<string, unknown>;
  availableResources: Record<string, number>;
};

export class CapabilityContractValidator {
  private contract: CapabilityContract;

  constructor(contract: CapabilityContract) {
    this.contract = contract;
  }

  /**
   * Validates the proposed tool use against the established contract.
   * @param context The current execution context.
   * @param proposedToolUse The tool use block proposed by the model.
   * @returns True if the contract is satisfied, false otherwise.
   */
  public validate(
    context: ExecutionContext,
    proposedToolUse: ToolUseBlock
  ): { isValid: boolean; reason: string } {
    if (proposedToolUse.name !== this.contract.toolName) {
      return {
        isValid: false,
        reason: `Tool name mismatch. Expected ${this.contract.toolName}, got ${proposedToolUse.name}.`,
      };
    }

    const inputValidation = this.validateInputs(proposedToolUse.input);
    if (!inputValidation.isValid) {
      return {
        isValid: false,
        reason: `Input validation failed: ${inputValidation.reason}`,
      };
    }

    const resourceValidation = this.validateResources(context.availableResources);
    if (!resourceValidation.isValid) {
      return {
        isValid: false,
        reason: `Resource constraint violation: ${resourceValidation.reason}`,
      };
    }

    const sideEffectValidation = this.validateSideEffects(context.userContext);
    if (!sideEffectValidation.isValid) {
      return {
        isValid: false,
        reason: `Side effect contract violation: ${sideEffectValidation.reason}`,
      };
    }

    return { isValid: true, reason: "Contract satisfied." };
  }

  private validateInputs(input: Record<string, unknown>): { isValid: boolean; reason: string } {
    const requiredInputs = this.contract.requiredInputs;
    for (const [key, definition] of Object.entries(requiredInputs)) {
      if (definition.required && !(key in input)) {
        return {
          isValid: false,
          reason: `Missing required input '${key}' for ${this.contract.toolName}.`,
        };
      }
      // Basic type check simulation
      if (typeof input[key] !== 'object' && typeof input[key] !== 'string' && typeof input[key] !== 'number') {
        // This is a simplified check, real validation would use a schema library
      }
    }
    return { isValid: true, reason: "Inputs are valid." };
  }

  private validateResources(availableResources: Record<string, number>): { isValid: boolean; reason: string } {
    const slas = this.contract.slas;
    for (const [resource, min] of Object.entries(slas.minRequiredResources)) {
      if ((availableResources[resource] || 0) < min) {
        return {
          isValid: false,
          reason: `Insufficient resource '${resource}'. Required: ${min}, Available: ${availableResources[resource] || 0}.`,
        };
      }
    }
    return { isValid: true, reason: "Resources are sufficient." };
  }

  private validateSideEffects(userContext: Record<string, unknown>): { isValid: boolean; reason: string } {
    const sideEffects = this.contract.sideEffects;
    const requiredPermissionsMet = sideEffects.requiredPermissions.every(
      (permission) => (userContext['permissions'] as any)?.includes(permission)
    );

    if (!requiredPermissionsMet) {
      return {
        isValid: false,
        reason: `Missing required permissions. Must have: ${sideEffects.requiredPermissions.join(', ')}.`,
      };
    }

    // Check if the proposed action is within allowed actions
    // (In a real scenario, the proposed action would be passed here)
    // For simplicity, we assume the contract defines the allowed actions.
    // We check if the context suggests an action that is not allowed.
    const contextAction = (userContext['action'] as string);
    if (contextAction && !sideEffects.allowedActions.includes(contextAction)) {
      return {
        isValid: false,
        reason: `Attempted action '${contextAction}' is not permitted by the contract. Allowed actions: ${sideEffects.allowedActions.join(', ')}.`,
      };
    }

    return { isValid: true, reason: "Side effects are compliant." };
  }
}