import { Message, ToolUseBlock } from "./message-types";

export interface SideEffect {
  type: "file_write" | "network_call" | "database_write";
  description: string;
}

export interface RequiredContext {
  contextKey: string;
  description: string;
  isMandatory: boolean;
}

export interface Capability {
  description: string;
  requiredContext: RequiredContext[];
  potentialSideEffects: SideEffect[];
  outputGuarantees: {
    schema: string;
    description: string;
  };
}

export class ToolCapabilityRegistry {
  private capabilities: Map<string, Capability> = new Map();

  registerCapability(toolId: string, capability: Capability): void {
    this.capabilities.set(toolId, capability);
  }

  discoverCapabilities(toolId: string): Capability | undefined {
    return this.capabilities.get(toolId);
  }

  validateContext(toolId: string, context: Record<string, unknown>): { isValid: boolean; missingContext: string[] } {
    const capability = this.discoverCapabilities(toolId);
    if (!capability) {
      return { isValid: false, missingContext: ["Tool not registered"] };
    }

    const missingContext: string[] = [];
    for (const required of capability.requiredContext) {
      if (required.isMandatory && !(required.contextKey in context)) {
        missingContext.push(required.contextKey);
      }
    }

    return {
      isValid: missingContext.length === 0,
      missingContext: missingContext,
    };
  }
}

export const toolCapabilityRegistry = new ToolCapabilityRegistry();