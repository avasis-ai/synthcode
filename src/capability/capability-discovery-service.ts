import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface AgentContext {
  sessionId: string;
  userProfile: Record<string, unknown>;
  availableTools: string[];
}

export interface CapabilityDescriptor {
  name: string;
  description: string;
  requiredInputs: Record<string, { type: string; description: string }>;
  outputs: Record<string, { type: string; description: string }>;
  compatibilityConstraints: {
    requires: string[];
    excludes: string[];
  };
  // A simplified representation of the tool that provides this capability
  toolName: string;
}

export interface ToolCall {
  toolName: string;
  functionName: string;
  input: Record<string, unknown>;
}

export interface CapabilityChainStep {
  toolCall: ToolCall;
  expectedOutput: Record<string, { type: string; description: string }>;
}

export class CapabilityDiscoveryService {
  private registry: Map<string, CapabilityDescriptor> = new Map();

  registerCapability(descriptor: CapabilityDescriptor): void {
    if (this.registry.has(descriptor.name)) {
      throw new Error(`Capability "${descriptor.name}" is already registered.`);
    }
    this.registry.set(descriptor.name, descriptor);
  }

  discoverCompatibleTools(requiredCapabilities: string[], context: AgentContext): {
    compatibleTools: {
      toolName: string;
      capability: string;
    }[];
    unmetCapabilities: string[];
  } {
    const compatibleTools: {
      toolName: string;
      capability: string;
    }[] = [];
    const unmetCapabilities: string[] = [];

    for (const requiredCap of requiredCapabilities) {
      let found = false;
      for (const [capName, descriptor] of this.registry.entries()) {
        if (capName === requiredCap) {
          // Basic check: does the tool exist and is it available?
          if (context.availableTools.includes(descriptor.toolName)) {
            compatibleTools.push({
              toolName: descriptor.toolName,
              capability: capName,
            });
            found = true;
            break;
          }
        }
      }
      if (!found) {
        unmetCapabilities.push(requiredCap);
      }
    }

    return { compatibleTools, unmetCapabilities };
  }

  resolveCapabilityChain(startCapability: string, context: AgentContext): {
    chain: CapabilityChainStep[];
    success: boolean;
    reason: string;
  } {
    const startDescriptor = this.registry.get(startCapability);
    if (!startDescriptor) {
      return { chain: [], success: false, reason: `Start capability "${startCapability}" not found.` };
    }

    const visitedCapabilities = new Set<string>();
    const chain: CapabilityChainStep[] = [];

    const resolveStep = (currentCapability: string, currentChain: CapabilityChainStep[]): {
      chain: CapabilityChainStep[];
      success: boolean;
      reason: string;
    } => {
      if (visitedCapabilities.has(currentCapability)) {
        return { chain: [], success: false, reason: `Cycle detected involving capability "${currentCapability}".` };
      }

      const descriptor = this.registry.get(currentCapability);
      if (!descriptor) {
        return { chain: [], success: false, reason: `Descriptor for "${currentCapability}" missing.` };
      }

      // 1. Check constraints against context/visited
      for (const constraint of [
        ...descriptor.compatibilityConstraints.requires,
        ...descriptor.compatibilityConstraints.excludes,
      ]) {
        if (constraint.startsWith("CAP_")) {
          const requiredCap = constraint.substring(4);
          if (!visitedCapabilities.has(requiredCap) && !this.registry.has(requiredCap)) {
            return { chain: [], success: false, reason: `Missing required capability dependency: ${requiredCap}` };
          }
        }
        if (constraint.startsWith("TOOL_")) {
          const requiredTool = constraint.substring(5);
          if (!context.availableTools.includes(requiredTool)) {
            return { chain: [], success: false, reason: `Tool dependency missing: ${requiredTool}` };
          }
        }
      }

      // 2. Determine the tool call (simplified: assume the toolName is the primary provider)
      const toolCall: ToolCall = {
        toolName: descriptor.toolName,
        functionName: descriptor.name,
        input: { /* Placeholder for complex input resolution */ },
      };

      // 3. Build the step
      const step: CapabilityChainStep = {
        toolCall: toolCall,
        expectedOutput: descriptor.outputs,
      };

      // 4. Recurse on next required capabilities (simplified: just use the first required output capability)
      let nextCapability: string | undefined = undefined;
      const outputKeys = Object.keys(descriptor.outputs);
      if (outputKeys.length > 0) {
        // In a real system, we'd select the most relevant output capability to chain from.
        nextCapability = outputKeys[0];
      }

      visitedCapabilities.add(currentCapability);
      const nextChainResult = nextCapability
        ? resolveStep(nextCapability, [...currentChain, step])
        : { chain: [...currentChain, step], success: true, reason: "Chain resolved successfully." };

      visitedCapabilities.delete(currentCapability);
      return nextChainResult;
    };

    const result = resolveStep(startCapability, []);
    return {
      chain: result.chain,
      success: result.success,
      reason: result.reason,
    };
  }
}